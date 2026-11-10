# RutaTicket · SaaS de boletería digital de transporte

**Estado: primer MVP de demostración local (v0.1). No es un SaaS operativo, una caja real ni un sistema de venta habilitado.**

Boletería destinada a operadores terrestres y marítimos, producto **independiente de PaseListo** (eventos). Requisitos aprobados en [REQUISITOS_SAAS](docs/REQUISITOS_SAAS.md).

## Funciones presentes en esta entrega
- Panel por operador **ficticio** con indicadores y salidas de prueba.
- Registro de rutas/salidas terrestres y marítimas; capacidad y tarifa referencial en VES.
- Selector visual de asientos; emisión de boletos DEMO con código único de prueba.
- Reglas de no duplicar asiento en una sesión y liberación tras anulación.
- Control de embarque con código de un solo uso de prueba.
- Cierre de caja ficticio con diferencia esperado/declarado y bloqueo de nuevas ventas de prueba en esa sesión.
- Auditoría y tests automatizados de aislamiento básico, duplicados, validaciones y caja.

**Limitaciones:** la información es sintética, local en el navegador, y puede borrarse desde «Restablecer demo». Cambiar de operador desde el selector no es autenticación. No hay ventas reales, pagos, QR firmados, preservación multiusuario, prevención de carreras entre dispositivos, roles reales, servidores, modo offline ni permisos de transporte comprobados.

## Ejecutar

Con Python 3 y un navegador actual:

```sh
python3 -m http.server 8080
```

Abrir **http://localhost:8080**.

Con Node.js 20+ (sin instalación de dependencias):

```sh
npm test
npm run check
```

La validación en navegador real está pendiente en esta entrega.

## Próximos hitos
Leer [arquitectura y etapas](docs/ARQUITECTURA_Y_HITOS.md) para el desarrollo de backend PostgreSQL, separación por taquilla/operador, ventas concurrentes, QR, pagos autorizados, cierres verificados, SaaS multicliente y normas para transporte. No se autoriza despliegue, fondos ni datos personales reales.


## Abrir la versión web desde GitHub (sin dominio)

**[Abrir RutaTicket en GitHub Pages](https://medinacaj.github.io/saas-ruta-ticket/)**. GitHub Pages publicó el frontend de demostración a partir de la rama exclusiva `gh-pages`, sin incorporar `server/` ni datos privados.

La web funciona en el navegador, guarda únicamente datos **ficticios** en `localStorage` de ese dispositivo y permite restablecerlos. **No hay autenticación real ni sincronización entre dispositivos.** Usar alias inventados, nunca datos de compradores o pasajeros reales.

## API backend de desarrollo (Node.js, local; no disponible en GitHub Pages)

Se añadió un servidor HTTP funcional en `server/index.mjs` con:

- Endpoints JSON `/api/v1/health`, `/api/v1/snapshot` y operaciones de gestión/boletos según el producto.
- Autorización DEMO por token Bearer distinto para cada organización, sin aceptar el tenant indicado por el navegador.
- Mutaciones serializadas en un proceso Node.js, protección de doble uso/asiento y claves de idempotencia opcionales; persiste datos sintéticos mediante escritura atómica en `.local/`.
- Pruebas HTTP automatizadas, aislamiento de operadores y transacciones de demostración.

**No es un backend de producción:** usa JSON en disco en vez de PostgreSQL, tiene credenciales de desarrollo, no resuelve consistencia entre varios servidores, no admite cuentas reales ni cumple aún requisitos regulatorios de boletería. El frontend de GitHub Pages utiliza almacenamiento local y **todavía no consume esta API**, que queda preparada para la integración segura posterior.

Para usar el backend en tu ordenador, configura dos tokens aleatorios largos en `TICKETING_DEMO_KEYS` y ejecuta `npm run api:dev`. El servidor escucha **solo en 127.0.0.1:8080**. Consulta el ejemplo de configuración en [backend de desarrollo](docs/BACKEND_DESARROLLO.md).
