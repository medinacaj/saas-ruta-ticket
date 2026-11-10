import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createDemoApi } from "./runtime.mjs";
import { seedDemo, createTrip, sellSeat, boardTicket, cancelTicket, closeCash, summary } from "../src/domain.mjs";

const staticRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export function buildServer({ tokens, filePath = resolve(staticRoot, ".local", "rutaticket.json") }) {
  return createDemoApi({
    seed: seedDemo, tokens, filePath, staticRoot,
    handlers: {
      product: "RutaTicket",
      view: (s, id) => ({
        organization: s.tenants.find((t) => t.id === id),
        trips: s.trips.filter((e) => e.tenantId === id),
        tickets: s.tickets.filter((t) => t.tenantId === id),
        cash: s.cash.find((c) => c.tenantId === id),
        audit: s.audit.filter((a) => a.tenantId === id).slice(0, 50),
        summary: summary(s, id)
      }),
      actions: {
        "/api/v1/trips": (s, id, p) => createTrip(s, id, p),
        "/api/v1/tickets": (s, id, p) => sellSeat(s, id, p.tripId, p.seat, p.alias),
        "/api/v1/boardings": (s, id, p) => boardTicket(s, id, p.code),
        "/api/v1/cancellations": (s, id, p) => cancelTicket(s, id, p.code),
        "/api/v1/cash/close": (s, id, p) => closeCash(s, id, p.declared)
      }
    }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let tokens;
  try { tokens = JSON.parse(process.env.TICKETING_DEMO_KEYS || "{}"); }
  catch { console.error("TICKETING_DEMO_KEYS debe ser un objeto JSON"); process.exit(1); }
  try {
    const { server, ready } = buildServer({ tokens });
    ready.then(() => server.listen(8080, "127.0.0.1", () =>
      console.log("Servidor DEMO RutaTicket (solo local) en http://127.0.0.1:8080")
    )).catch((err) => { console.error(err.message); process.exit(1); });
  } catch (err) { console.error(err.message); process.exit(1); }
}
