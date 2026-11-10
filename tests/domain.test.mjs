import test from "node:test";
import assert from "node:assert/strict";
import { seedDemo, createTrip, sellSeat, occupiedSeats, ticketFor, boardTicket, cancelTicket, summary, closeCash } from "../src/domain.mjs";

test("dos operadores no comparten rutas, boletos ni caja", () => {
  const s = seedDemo();
  const t = sellSeat(s, "operador-costa", "trip-c1", 1, "Pasajero ficticio");
  assert.throws(() => sellSeat(s, "operador-lago", "trip-c1", 1, "Pasajero ajeno"), /inexistente/);
  assert.throws(() => ticketFor(s, "operador-lago", t.code), /inexistente/);
  assert.throws(() => boardTicket(s, "operador-lago", t.code), /inexistente/);
  assert.equal(summary(s, "operador-lago").sold, 0);
  assert.equal(summary(s, "operador-costa").sold, 1);
});
test("un asiento no se vende dos veces y se libera al anular", () => {
  const s = seedDemo();
  const t = sellSeat(s, "operador-costa", "trip-c1", 3, "Pasajero Demo");
  assert.throws(() => sellSeat(s, "operador-costa", "trip-c1", 3, "Otro pasajero"), /ocupado/);
  assert.deepEqual(occupiedSeats(s, "operador-costa", "trip-c1"), [3]);
  cancelTicket(s, "operador-costa", t.code);
  assert.deepEqual(occupiedSeats(s, "operador-costa", "trip-c1"), []);
  sellSeat(s, "operador-costa", "trip-c1", 3, "Nuevo pasajero");
  assert.equal(summary(s, "operador-costa").sold, 1);
});
test("control de embarque de un solo uso y asientos", () => {
  const s = seedDemo();
  const t = sellSeat(s, "operador-costa", "trip-c1", 12, "Pasajero Demo");
  assert.throws(() => sellSeat(s, "operador-costa", "trip-c1", 13, "Pasajero Demo"), /inexistente/);
  boardTicket(s, "operador-costa", t.code);
  assert.throws(() => boardTicket(s, "operador-costa", t.code), /utilizado/);
  assert.throws(() => cancelTicket(s, "operador-costa", t.code), /embarcar/);
});
test("cierre de caja calcula diferencia y bloquea ventas", () => {
  const s = seedDemo();
  sellSeat(s, "operador-costa", "trip-c1", 1, "Pasajero Demo");
  sellSeat(s, "operador-costa", "trip-c1", 2, "Pasajero Demo");
  const cash = closeCash(s, "operador-costa", 330);
  assert.equal(cash.expectedAmount, 360);
  assert.equal(cash.difference, -30);
  assert.equal(summary(s, "operador-lago").cash.status, "open");
  assert.throws(() => sellSeat(s, "operador-costa", "trip-c1", 4, "Pasajero Demo"), /Caja cerrada/);
  assert.throws(() => closeCash(s, "operador-costa", 0), /ya está cerrada/);
});
test("validaciones de salida y tenant", () => {
  const s = seedDemo();
  const input = { origin: "Valencia", destination: "Maracay", departure: "2027-04-10T08:00", mode: "Terrestre", seats: 10, fare: 100 };
  assert.throws(() => createTrip(s, "operador-costa", { ...input, seats: 0 }), /Capacidad inválida/);
  assert.throws(() => createTrip(s, "operador-costa", { ...input, mode: "Aéreo" }), /Modalidad inválida/);
  assert.throws(() => createTrip(s, "operador-costa", { ...input, destination: "Valencia" }), /distintos/);
  const trip = createTrip(s, "operador-lago", input);
  assert.equal(trip.tenantId, "operador-lago");
  assert.throws(() => occupiedSeats(s, "operador-costa", trip.id), /inexistente/);
});
