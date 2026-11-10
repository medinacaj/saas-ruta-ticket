# Requisitos SaaS — Boletería Digital — Transporte (#23)

> **Decisión de producto:** herramienta SaaS comercial independiente, aprobada el 9 de noviembre de 2026.  
> **Estado actual:** concepto por validar; no se afirma implementación, base de datos, clientes, pagos ni producción.  
> **Ubicación actual:** especificación provisional en MediOS; el repositorio independiente de la herramienta no se ha identificado entre los repositorios GitHub accesibles. No crear ni asociar otro sin verificar la URL.

## Principios comunes obligatorios
1. Arquitectura SaaS multicliente: organización/operador independiente por cliente con aislamiento de datos efectivo en backend, BD, archivos, reportes y QR.
2. Registro, onboarding e invitaciones; usuarios, roles, MFA acorde al riesgo, revocación y recuperación segura.
3. Planes y suscripciones con límites de uso, facturación del *servicio SaaS*, estados de alta/renovación/suspensión/cancelación; distinguir estos cobros de las operaciones comerciales de cada cliente.
4. Panel independiente del cliente y consola administrativa de la plataforma con separación de privilegios.
5. Auditoría, backups con restauración probada, seguridad, monitorización, protección de datos, exportación y retención/borrado de información.
6. Pruebas automatizadas con **dos clientes independientes** y pruebas negativas de acceso cruzado, concurrencia y permisos. CI, migraciones y puertas de lanzamiento.
7. Integrar pagos solo con operadores/proveedores autorizados cuando corresponda. No asumir custodia de fondos, aprobación regulatoria, acceso a operadores externos ni comercialización ya existente.

## Política de implementación
- Preparar arquitectura y MVP con datos sintéticos, diseñar hitos incrementales y contrastar demanda/precios con clientes reales antes de inversión importante.
- Toda funcionalidad es **prevista** hasta verificarla en código y tests.
- Mantener el producto privado y no desplegarlo con datos reales, pagos activos ni usuarios externos sin evaluación legal, privacidad y autorización del propietario.
- Conservar diferenciación entre estos dos negocios de boletería: pueden compartir componentes bajo licencia adecuada, pero **no** fusionarse como producto comercial.
- Tras identificar el repositorio independiente correspondiente, trasladar allí este documento, abrir issue de ejecución y dejar en MediOS el vínculo histórico.

## Alcance comercial
- Clientes que contratan el servicio: **pequeñas boleterías y operadores de transporte terrestre y marítimo**; pueden gestionar una o varias taquillas según plan.
- Usuarios del negocio: cajeros, encargados, supervisores y operadores. Pasajeros son clientes de las empresas de transporte, no suscriptores obligatorios del SaaS.
- Monetización propuesta: licencia/suscripción por operador, sucursal/taquilla o volumen y posible instalación/soporte. Validar disposición de pago.

## Módulos previstos
1. Alta de operadores, taquillas, rutas, destinos, horarios, viajes/salidas, unidades y tarifas.
2. Control de asientos/cupos por salida y prevención de doble asignación concurrente.
3. Venta en mostrador y gestión de reservas, cambios, anulaciones y reemisiones.
4. Boleto digital e imprimible con código único/QR, control de validez y pasajeros según requisitos aplicables.
5. Caja diaria: apertura/cierre, conciliación, arqueo, reportes por agente y operador.
6. Roles por operador/taquilla, auditoría y acceso protegido desde equipos compartidos.
7. Evaluación de **operación sin conexión**: política de consistencia y reconciliación, sin permitir sobreventa; no prometer offline hasta validarlo técnicamente.
8. Administración SaaS: suscripciones, límites por taquilla/sucursal y suspensión segura, manteniendo integridad de ventas históricas.

## Condiciones específicas de aceptación
- [ ] Dos operadores y varias taquillas de prueba con aislamiento total de rutas, pasajeros, viajes, cajas, reportes y boletos.
- [ ] Una plaza no puede venderse dos veces aunque existan cajeros simultáneos o reconexión tardía.
- [ ] Cierre de caja y auditoría registran anulaciones, usuarios y conciliación de manera verificable.
- [ ] Se estudió y probó la operación conectada/degradada antes de habilitar cualquier modalidad offline.
- [ ] Validación específica de reglas y permisos de transporte terrestre y marítimo y datos de pasajeros antes de producción.

## Fuera de alcance
- Eventos y espectáculos: pertenecen al SaaS de Venta de boletos para eventos (#22).


## Identificación del repositorio

Repositorio de producto: `medinacaj/saas-rutaticket`. Fuente histórica: `medinacaj/MediOS/docs/saas/BOLETERIA_TRANSPORTE.md`. Estas instrucciones no demuestran funcionalidades implementadas.
