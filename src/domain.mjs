// Demo local. Las reglas no sustituyen transacciones de BD ni autorización real.
const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();
const fail = (message) => { throw new Error(message); };
const textVal = (value, max = 70) => {
  const valueText = String(value ?? "").trim();
  if (valueText.length < 2 || valueText.length > max) fail("Texto requerido de 2 a " + max + " caracteres");
  return valueText;
};
const tenant = (state, tenantId) => state.tenants.find((t) => t.id === tenantId) || fail("Operador no encontrado");
const tripFor = (state, tenantId, id) => {
  tenant(state, tenantId);
  return state.trips.find((t) => t.id === id && t.tenantId === tenantId) || fail("Salida inexistente para este operador");
};
const cashFor = (state, tenantId) => state.cash.find((c) => c.tenantId === tenantId) || fail("Caja no encontrada");
const record = (state, tenantId, action, ref) => state.audit.unshift({ id: uid(), tenantId, action, ref, at: now() });
// Pure calendar validation: Date.parse may normalize impossible local dates.
const departureIsValid = value => {
  const match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return false;
  const [,year,month,day,hour,minute]=match.map(Number);
  if (year<2025||year>2099||month<1||month>12||hour>23||minute>59||day<1) return false;
  return day<=new Date(Date.UTC(year,month,0)).getUTCDate();
};

export function seedDemo() {
  return {
    tenants: [
      { id: "operador-costa", name: "Transporte Costa (demo)" },
      { id: "operador-lago", name: "Rutas del Lago (demo)" }
    ],
    trips: [
      { id: "trip-c1", tenantId: "operador-costa", origin: "Puerto La Cruz", destination: "Cumaná", departure: "2027-02-10T08:00", mode: "Terrestre", seats: 12, fare: 180, currency: "VES" },
      { id: "trip-c2", tenantId: "operador-costa", origin: "Cumaná", destination: "Carúpano", departure: "2027-02-10T13:00", mode: "Terrestre", seats: 16, fare: 220, currency: "VES" },
      { id: "trip-l1", tenantId: "operador-lago", origin: "Maracaibo", destination: "Cabimas", departure: "2027-02-10T09:30", mode: "Marítimo", seats: 10, fare: 125, currency: "VES" }
    ],
    tickets: [], audit: [],
    cash: [
      { tenantId: "operador-costa", status: "open", closedAt: null, declaredAmount: null },
      { tenantId: "operador-lago", status: "open", closedAt: null, declaredAmount: null }
    ]
  };
}
export function occupiedSeats(state, tenantId, tripId) {
  tripFor(state, tenantId, tripId);
  return state.tickets
    .filter((t) => t.tenantId === tenantId && t.tripId === tripId && t.status !== "cancelled")
    .map((t) => t.seat);
}
export function createTrip(state, tenantId, input) {
  tenant(state, tenantId);
  const seats = Number(input.seats), fare = Number(input.fare), departure = String(input.departure || "");
  if (!Number.isSafeInteger(seats) || seats < 1 || seats > 80) fail("Capacidad inválida (1 a 80)");
  if (!Number.isSafeInteger(fare) || fare < 0 || fare > 100000000) fail("Tarifa de demostración inválida");
  if (!departureIsValid(departure)) fail("Fecha y hora inválidas");
  const mode = String(input.mode || "");
  if (!["Terrestre", "Marítimo"].includes(mode)) fail("Modalidad inválida");
  const trip = {
    id: uid(), tenantId, origin: textVal(input.origin), destination: textVal(input.destination),
    departure, mode, seats, fare, currency: "VES"
  };
  if (trip.origin.toLocaleLowerCase() === trip.destination.toLocaleLowerCase()) fail("Origen y destino deben ser distintos");
  state.trips.push(trip);
  record(state, tenantId, "Salida DEMO creada", trip.id);
  return trip;
}
export function sellSeat(state, tenantId, tripId, seatInput, alias) {
  const trip = tripFor(state, tenantId, tripId);
  if (cashFor(state, tenantId).status !== "open") fail("Caja cerrada: no pueden registrarse más ventas de prueba");
  const seat = Number(seatInput);
  if (!Number.isSafeInteger(seat) || seat < 1 || seat > trip.seats) fail("Asiento inexistente");
  if (occupiedSeats(state, tenantId, tripId).includes(seat)) fail("Asiento ocupado");
  const ticket = {
    id: uid(), code: "RT-" + uid().replaceAll("-", "").slice(0, 16).toUpperCase(),
    tenantId, tripId, seat, alias: textVal(alias, 60), fare: trip.fare,
    currency: trip.currency, status: "sold", createdAt: now(), boardedAt: null
  };
  state.tickets.push(ticket);
  record(state, tenantId, "Boleto DEMO emitido", ticket.id);
  return ticket;
}
export function ticketFor(state, tenantId, code) {
  tenant(state, tenantId);
  return state.tickets.find((t) => t.tenantId === tenantId && t.code === String(code || "").trim().toUpperCase())
    || fail("Boleto inexistente en este operador");
}
export function boardTicket(state, tenantId, code) {
  const ticket = ticketFor(state, tenantId, code);
  if (ticket.status !== "sold") fail("Boleto ya utilizado o anulado");
  ticket.status = "boarded";
  ticket.boardedAt = now();
  record(state, tenantId, "Embarque DEMO validado", ticket.id);
  return ticket;
}
export function cancelTicket(state, tenantId, code) {
  const ticket = ticketFor(state, tenantId, code);
  if (cashFor(state, tenantId).status !== "open") fail("Caja cerrada: la anulación requiere un ajuste en otra sesión");
  if (ticket.status !== "sold") fail("Solo pueden anularse boletos sin embarcar");
  ticket.status = "cancelled";
  record(state, tenantId, "Boleto DEMO anulado", ticket.id);
  return ticket;
}
export function summary(state, tenantId) {
  tenant(state, tenantId);
  const trips = state.trips.filter((x) => x.tenantId === tenantId);
  const tickets = state.tickets.filter((x) => x.tenantId === tenantId);
  return {
    departures: trips.length,
    sold: tickets.filter((t) => t.status !== "cancelled").length,
    boarded: tickets.filter((t) => t.status === "boarded").length,
    amountSimulated: tickets.filter((t) => t.status !== "cancelled").reduce((sum, t) => sum + t.fare, 0),
    cash: cashFor(state, tenantId)
  };
}
export function closeCash(state, tenantId, declaredInput) {
  const cash = cashFor(state, tenantId);
  if (cash.status !== "open") fail("La caja ya está cerrada");
  const declared = Number(declaredInput);
  if (!Number.isSafeInteger(declared) || declared < 0 || declared > 1000000000) fail("Importe declarado inválido");
  const expected = summary(state, tenantId).amountSimulated;
  cash.status = "closed";
  cash.closedAt = now();
  cash.declaredAmount = declared;
  cash.expectedAmount = expected;
  cash.difference = declared - expected;
  record(state, tenantId, "Cierre de caja DEMO", tenantId);
  return cash;
}
