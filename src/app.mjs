import { seedDemo, createTrip, occupiedSeats, sellSeat, boardTicket, cancelTicket, summary, closeCash } from "./domain.mjs";
import { loadDemo, saveDemo, clearDemo } from "./storage.mjs";

let state = loadDemo("rutaticket", seedDemo);
let tenantId = state.tenants[0].id;
let tripId = "trip-c1";
let activeSeat = 1;
let message = "";
let error = false;
const app = document.querySelector("#app");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
const money = (n) => new Intl.NumberFormat("es-VE", { style: "currency", currency: "VES", maximumFractionDigits: 0 }).format(n);
const humanDate = (s) => { const d = new Date(s); return Number.isNaN(d.getTime()) ? s : new Intl.DateTimeFormat("es-VE", { dateStyle: "medium", timeStyle: "short" }).format(d); };
function feedback(text, isError = false) { message = text; error = isError; render(); }
function run(action, success) { try { action(); feedback(success); } catch (e) { feedback(e.message, true); } }
function render() {
  saveDemo("rutaticket", state);
  const trips = state.trips.filter((t) => t.tenantId === tenantId);
  if (!trips.some((t) => t.id === tripId)) { tripId = trips[0]?.id || ""; activeSeat = 1; }
  const trip = trips.find((t) => t.id === tripId);
  const occupied = trip ? occupiedSeats(state, tenantId, trip.id) : [];
  if (occupied.includes(activeSeat) || (trip && activeSeat > trip.seats)) activeSeat = Array.from({ length: trip.seats }, (_, i) => i + 1).find((i) => !occupied.includes(i)) || 0;
  const tickets = state.tickets.filter((t) => t.tenantId === tenantId && t.tripId === tripId);
  const total = summary(state, tenantId);
  const logs = state.audit.filter((a) => a.tenantId === tenantId).slice(0, 5);
  app.innerHTML =
    '<div class="shell"><aside class="sidebar"><a class="brand" href="#contenido"><span class="brand-icon">R</span><span>Ruta<span class="brand-accent">Ticket</span><small>Boletería y operación</small></span></a>' +
    '<div class="side-label">OPERADOR DE DEMOSTRACIÓN</div><label for="tenant">Empresa operadora</label><select id="tenant" class="field">' +
    state.tenants.map((o) => '<option value="' + esc(o.id) + '"' + (o.id === tenantId ? " selected" : "") + '>' + esc(o.name) + '</option>').join("") +
    '</select><nav aria-label="Secciones"><a class="nav-active" href="#contenido">Vista general</a><a href="#salidas">Salidas</a><a href="#boletos">Asientos y boletos</a><a href="#caja">Caja</a></nav>' +
    '<div class="side-note">Operadores y viajes sintéticos. El selector solo sirve para probar vistas separadas: no autentica.</div><button type="button" class="reset-demo" data-reset-demo>Restablecer demo</button></aside>' +
    '<main id="contenido" class="main"><div class="top"><div><p class="eyebrow">CENTRO DE BOLETERÍA</p><h1>Control de salidas</h1><p class="subtitle">Organiza rutas, asigna asientos y registra caja de prueba.</p></div><div class="top-chip">Versión 0.1 · demo</div></div>' +
    '<div class="warning" role="note"><strong>Entorno demostrativo</strong> · Sin pasajeros reales, cobros ni reservas. Datos ficticios guardados solo en este navegador; no hay autenticación, sincronización ni emisión fiscal.</div>' +
    (message ? '<p class="' + (error ? "notice error" : "notice") + '" role="status">' + esc(message) + '</p>' : "") +
    '<section class="metrics" aria-label="Indicadores"><article><span>Salidas</span><strong>' + total.departures + '</strong><small>De este operador</small></article>' +
    '<article><span>Boletos activos</span><strong>' + total.sold + '</strong><small>Sin anulados</small></article>' +
    '<article><span>Embarques</span><strong>' + total.boarded + '</strong><small>Validación de prueba</small></article>' +
    '<article><span>Importe teórico</span><strong>' + money(total.amountSimulated) + '</strong><small>No representa cobros reales</small></article></section>' +
    '<div class="columns"><section class="panel" id="salidas"><div class="panel-head"><div><h2>Rutas y salidas</h2><p>Gestiona salidas terrestres o marítimas.</p></div></div>' +
    '<div class="event-list">' + trips.map((t) => '<button class="event' + (t.id === tripId ? " selected" : "") + '" type="button" data-trip="' + esc(t.id) + '"><span class="event-title">' + esc(t.origin) + ' → ' + esc(t.destination) + '</span><span class="muted">' + esc(t.mode) + ' · ' + esc(humanDate(t.departure)) + '</span><span class="event-foot">' + occupiedSeats(state, tenantId, t.id).length + ' / ' + t.seats + ' asientos · ' + money(t.fare) + '</span></button>').join("") + '</div>' +
    '<details><summary>Crear salida de prueba</summary><form id="new-trip" class="form-grid"><label>Origen<input required name="origin" minlength="2" maxlength="70" placeholder="Ej.: Valencia"></label><label>Destino<input required name="destination" minlength="2" maxlength="70" placeholder="Ej.: Maracay"></label><label>Modalidad<select class="input-select" name="mode"><option value="Terrestre">Terrestre</option><option value="Marítimo">Marítimo</option></select></label><label>Fecha y hora<input required name="departure" type="datetime-local"></label><div class="form-pair"><label>Cupos<input required name="seats" type="number" min="1" max="80" value="12"></label><label>Tarifa referencial VES<input required name="fare" type="number" min="0" step="1" value="150"></label></div><button class="btn" type="submit">Crear salida</button></form></details></section>' +
    '<section class="panel" id="boletos"><div class="panel-head"><div><h2>Asientos y boletos</h2><p>' + (trip ? esc(trip.origin + " → " + trip.destination) : "Selecciona una salida") + '</p></div><span class="pill">' + (trip ? occupied.length + "/" + trip.seats : "—") + '</span></div>' +
    (trip ? '<div class="seat-title">Selecciona un asiento libre</div><div class="seatmap" role="group" aria-label="Mapa de asientos">' + Array.from({ length: trip.seats }, (_, i) => i + 1).map((i) => '<button type="button" class="seat ' + (occupied.includes(i) ? "occupied" : i === activeSeat ? "active" : "") + '" data-seat="' + i + '" ' + (occupied.includes(i) ? "disabled" : "") + ' aria-pressed="' + (i === activeSeat && !occupied.includes(i) ? "true" : "false") + '" aria-label="Asiento ' + i + (occupied.includes(i) ? " ocupado" : " libre") + '">' + i + '</button>').join("") + '</div>' +
    '<div class="legend"><span>◼ Libre</span><span>◼ Seleccionado</span><span>◼ Ocupado</span></div>' +
    '<form id="new-ticket" class="form-inline"><label>Alias de pasajero ficticio<input required name="alias" minlength="2" maxlength="60" placeholder="Ej.: Pasajero Demo" autocomplete="off"></label><button class="btn" type="submit" ' + (!activeSeat || total.cash.status !== "open" ? "disabled" : "") + '>Emitir asiento ' + activeSeat + '</button></form>' : "<p>Selecciona una salida.</p>") +
    '<form id="boarding" class="form-inline access"><label>Validar boleto de prueba<input required name="code" placeholder="RT-..." autocomplete="off"></label><button class="btn secondary" type="submit">Registrar embarque</button></form>' +
    '<div class="table-wrap"><table><thead><tr><th>Asiento</th><th>Alias</th><th>Código</th><th>Estado</th><th>Acción</th></tr></thead><tbody>' +
    (tickets.length ? tickets.slice().reverse().map((t) => '<tr><td>' + t.seat + '</td><td>' + esc(t.alias) + '</td><td><code>' + esc(t.code) + '</code></td><td><span class="tag ' + esc(t.status) + '">' + (t.status === "sold" ? "Emitido" : t.status === "boarded" ? "Embarcado" : "Anulado") + '</span></td><td>' + (t.status === "sold" && total.cash.status === "open" ? '<button type="button" class="link-btn" data-cancel="' + esc(t.code) + '">Anular</button>' : "—") + '</td></tr>').join("") : '<tr><td colspan="5" class="empty">Sin boletos de prueba</td></tr>') + '</tbody></table></div></section></div>' +
    '<section class="panel activity" id="caja"><div class="panel-head"><div><h2>Control de caja</h2><p>Arqueo simulado de esta organización. No corresponde a dinero recibido.</p></div><span class="pill">' + (total.cash.status === "open" ? "Abierta (demo)" : "Cerrada (demo)") + '</span></div>' +
    (total.cash.status === "open" ? '<form id="close-cash" class="form-inline"><label>Importe declarado de prueba (VES)<input required name="declared" type="number" min="0" step="1" value="' + total.amountSimulated + '"></label><button type="submit" class="btn secondary">Cerrar caja demo</button></form>' : '<p>Esperado: <strong>' + money(total.cash.expectedAmount) + '</strong> · Declarado: <strong>' + money(total.cash.declaredAmount) + '</strong> · Diferencia: <strong>' + money(total.cash.difference) + '</strong></p>') +
    '<h3>Actividad reciente</h3>' + (logs.length ? '<ul class="audit">' + logs.map((a) => '<li><span>' + esc(a.action) + '</span><time>' + esc(humanDate(a.at)) + '</time></li>').join("") + '</ul>' : '<p class="muted">Sin actividad en esta sesión.</p>') +
    '</section><footer>© RutaTicket · Primera etapa · No habilitada para venta comercial de pasajes.</footer></main></div>';
}
app.addEventListener("change", (ev) => {
  if (ev.target.id === "tenant") { tenantId = ev.target.value; tripId = ""; activeSeat = 1; feedback("Cambiaste de operador de prueba."); }
});
app.addEventListener("click", (ev) => {
  const t = ev.target.closest("[data-trip]");
  const seat = ev.target.closest("[data-seat]");
  const cancel = ev.target.closest("[data-cancel]");
  if (t) { tripId = t.dataset.trip; activeSeat = 1; message = ""; render(); }
  if (seat && !seat.disabled) { activeSeat = Number(seat.dataset.seat); message = ""; render(); }
  if (cancel && confirm("¿Anular el boleto de demostración?")) run(() => cancelTicket(state, tenantId, cancel.dataset.cancel), "Boleto de prueba anulado. Asiento liberado.");
});
app.addEventListener("submit", (ev) => {
  if (!["new-trip", "new-ticket", "boarding", "close-cash"].includes(ev.target.id)) return;
  ev.preventDefault();
  const data = Object.fromEntries(new FormData(ev.target).entries());
  if (ev.target.id === "new-trip") run(() => { tripId = createTrip(state, tenantId, data).id; activeSeat = 1; }, "Salida de prueba creada.");
  if (ev.target.id === "new-ticket") run(() => sellSeat(state, tenantId, tripId, activeSeat, data.alias), "Asiento de prueba emitido; no se realizó ningún pago.");
  if (ev.target.id === "boarding") run(() => boardTicket(state, tenantId, data.code), "Embarque de prueba validado.");
  if (ev.target.id === "close-cash" && confirm("El cierre de caja impedirá más ventas y anulaciones en esta sesión demo. ¿Continuar?")) run(() => closeCash(state, tenantId, data.declared), "Caja demostrativa cerrada; diferencia calculada.");
});
app.addEventListener("click", (ev) => {
  if (ev.target.closest("[data-reset-demo]")) {
    if (confirm("¿Restablecer los datos ficticios de esta demostración?")) {
      clearDemo("rutaticket");
      state = seedDemo();
      tenantId = state.tenants[0].id;
      tripId = ""; activeSeat = 1;
      feedback("Demostración restablecida.");
    }
  }
});
render();
