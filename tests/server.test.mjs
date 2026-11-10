import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildServer } from "../server/index.mjs";

const keys = { "operador-costa": "test-key-costa-0123456789-abcdef", "operador-lago": "test-key-lago-0123456789-abcdef" };
async function runServer(t) {
  const dir = await mkdtemp(join(tmpdir(), "rutaticket-test-"));
  const db = join(dir, "state.json");
  const app = buildServer({ tokens: keys, filePath: db });
  await app.ready;
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  t.after(async () => { await new Promise((resolve) => app.server.close(resolve)); await rm(dir, { recursive: true, force: true }); });
  const url = "http://127.0.0.1:" + app.server.address().port;
  const call = async (path, token, data, key) => {
    const res = await fetch(url + path, { method: data ? "POST" : "GET", headers: { Authorization: token ? "Bearer " + keys[token] : "", "Content-Type": "application/json", ...(key ? { "Idempotency-Key": key } : {}) }, ...(data ? { body: JSON.stringify(data) } : {}) });
    return { status: res.status, body: await res.json() };
  };
  return { call };
}
test("API exige token, aparta operadores y rechaza doble asiento concurrente", async (t) => {
  const { call } = await runServer(t);
  assert.equal((await call("/api/v1/snapshot")).status, 401);
  const seat = { tripId: "trip-c1", seat: 5, alias: "Pasajero ficticio" };
  const concurrent = await Promise.all([call("/api/v1/tickets", "operador-costa", seat, "sale-demo-0001"), call("/api/v1/tickets", "operador-costa", { ...seat, alias: "Otro pasajero" }, "sale-demo-0002")]);
  assert.deepEqual(concurrent.map((r) => r.status).sort(), [201, 409]);
  const ticket = concurrent.find((r) => r.status === 201).body;
  assert.equal((await call("/api/v1/snapshot", "operador-lago")).body.tickets.length, 0);
  assert.equal((await call("/api/v1/boardings", "operador-lago", { code: ticket.code })).status, 404);
  assert.equal((await call("/api/v1/boardings", "operador-costa", { code: ticket.code })).status, 201);
  assert.equal((await call("/api/v1/boardings", "operador-costa", { code: ticket.code })).status, 409);
});
test("cierre de caja persiste y bloquea venta nueva", async (t) => {
  const { call } = await runServer(t);
  const tkt = await call("/api/v1/tickets", "operador-costa", { tripId: "trip-c1", seat: 2, alias: "Pasajero ficticio" });
  assert.equal(tkt.status, 201);
  const closing = await call("/api/v1/cash/close", "operador-costa", { declared: 175 });
  assert.equal(closing.body.difference, -5);
  assert.equal((await call("/api/v1/tickets", "operador-costa", { tripId: "trip-c1", seat: 3, alias: "Nuevo pasajero" })).status, 409);
});
