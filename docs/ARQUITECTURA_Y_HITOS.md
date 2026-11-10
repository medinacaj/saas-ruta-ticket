# Arquitectura y etapas — RutaTicket

## Estado verificado de este hito (v0.1)
- Panel responsive en español con selector de **dos operadores sintéticos**, rutas/salidas terrestres y marítimas, alta de salidas, mapa de asientos, emisión/anulación de boleto ficticio, validación de embarque y cierre de caja DEMO por operador.
- Reglas de negocio en `src/domain.mjs`: asiento único por salida en una sesión, liberar asiento al anular, bloqueo de venta tras cierre, diferencia entre importe esperado y declarado, auditoría y vista separada por tenant.
- No hay backend, cuentas, taquillas reales, pagos, pasajeros reales, base de datos, QR firmado, reservas de múltiples usuarios ni operación offline. Estado únicamente en memoria y no persistente.
- Selector demostrativo **no autentica ni representa aislamiento seguro**. Nunca utilizar para ventas reales ni procesamiento de datos personales.
- El dinero mostrado es un valor teórico de pruebas. El cierre de caja **no es conciliación financiera real**.

## Plan de endurecimiento (por implementar)
1. Backend Next.js/TypeScript + PostgreSQL y transacciones, siguiendo prácticas de Digi CRM, sujeto a ADR y pruebas.
2. Aislamiento multioperador/taquilla por API, RBAC (propietario, admin, supervisor, cajero, inspector), PostgreSQL RLS con usuario servidor de privilegios mínimos y pruebas con operadores independientes.
3. Definir modelo de operador, oficinas, rutas, frecuencias, unidades (bus/embarcación), salidas, tarifas, reservas, disponibilidad y caja por jornada/taquilla/cajero.
4. Crear restricción única parcial por `departure_id` + `seat_number` para estados activos, además de transacciones de venta con bloqueos y **idempotency key**. Tests de concurrencia intersesión y reconciliación de pagos. Nunca confiar en la validación del navegador.
5. Emisión de boleto imprimible y QR seguro único, embarque transaccional con controles anti-replay y revocaciones.
6. Caja: apertura, turnos, pagos verificados mediante proveedores autorizados, anulaciones, devoluciones, cierres por cajero, arqueo, diferencias, exportación y auditoría inmutable.
7. Análisis normativo por modalidad y jurisdicción, datos de pasajeros, derechos de cancelación, términos, registro y licencias. Offline **solo tras diseñar cuotas por dispositivo y protocolo seguro de reconciliación**.
8. SaaS: empresas y sedes aisladas, suscripción, límites de sucursales, panel administrativo, MFA, copias de seguridad/restauración, privacidad y logs.

## Puertas de calidad
- [x] Demo local con interfaz de salidas, asientos, boletos y caja.
- [x] Pruebas de dominio: aislamiento entre dos operadores, asiento duplicado, anulaciones, embarque único, caja y errores.
- [ ] Aislamiento y permisos probados en backend y PostgreSQL con dos operadores.
- [ ] Concurrencia y unicidad de asientos probadas con dos cajeros en paralelo.
- [ ] Boletos/QR e integraciones de pago seguros, reversos y cierres reales.
- [ ] Procedimiento de contingencia y modo offline verificado; si no existe, impedir operar sin red.
- [ ] Validación regulatoria terrestre y marítima, protección de datos, UX accesible y backups/restore.
- [ ] Despliegue comercial expresamente aprobado.

## Gobierno
Este producto es comercialmente independiente de PaseListo. La base actual permite revisión de flujos, no vende pasajes. El repositorio es público en GitHub al comienzo de esta etapa; utilizar únicamente código y datos ficticios. Revisión humana mediante PR, sin cambio de visibilidad, hosting, secretos ni proveedores externos.
