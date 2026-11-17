# Despliegue de DeliverUS

El Dockerfile construye las dos aplicaciones Expo originales con Node 24 y sirve sus exportaciones desde Express. Customer usa `/customer/`, Owner usa `/owner/` y ambas consumen `/api` en el mismo origen HTTPS. React Navigation mantiene la navegación dentro de la aplicación. Una recarga abre su pantalla inicial y recupera la sesión guardada para ese rol. Los recursos inexistentes devuelven 404.

## Servicios en Railway

| Servicio | Origen | Almacenamiento |
| --- | --- | --- |
| DeliverUS | Este repositorio, Dockerfile en la raíz | Volumen en `/data`, uploads en `/data/public` |
| MariaDB | Imagen oficial `mariadb:11.4.10` | Volumen en `/var/lib/mysql` |

Usa una réplica de cada servicio, en la misma región. MariaDB sólo necesita la red privada. El servicio DeliverUS recibe un dominio HTTPS con puerto de destino 3000 y comprueba `/api/health`. Ese endpoint comprueba una conexión real a la base.

El entrypoint prepara los permisos del volumen y ejecuta Node sin privilegios de administrador. Los assets de ejemplo permanecen en la imagen y también sirven como respaldo de las rutas `/public` cuando faltan en el volumen.

En MariaDB configura `MARIADB_DATABASE`, `MARIADB_USER`, `MARIADB_PASSWORD` y `MARIADB_ROOT_PASSWORD`. Genera contraseñas distintas para el usuario de la aplicación y el administrador. El comando de arranque usa la entrada oficial de la imagen.

```sh
docker-entrypoint.sh mariadbd --bind-address=:: --max-connections=40 --innodb-buffer-pool-size=134217728
```

En DeliverUS configura estas variables en el proveedor.

| Variable | Valor o función |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | `3000`, o el puerto asignado por el proveedor |
| `HOST` | `0.0.0.0` |
| `DATABASE_HOST` | Dominio privado del servicio MariaDB |
| `DATABASE_PORT` | `3306` |
| `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` | Referencias a la base y usuario limitado de MariaDB |
| `UPLOAD_ROOT` | `/data` |
| `AVATARS_FOLDER` | `public/avatars` |
| `RESTAURANTS_FOLDER` | `public/restaurants` |
| `PRODUCTS_FOLDER` | `public/restaurants/products` |
| `WEB_ROOT` | `/app/web` |
| `DEMO_MODE` | `true`, activa protección de cuentas compartidas, límites y errores sanitizados |
| `SEED_DEMO` | `true` en la primera instalación de la demo, `false` tras inicializarla |
| `ALLOWED_ORIGINS` | Origen HTTPS exacto del servicio, separado por comas si hay más sitios autorizados |
| `TRUST_PROXY` | `1` para el proxy de Railway |

Las contraseñas se configuran en Railway. En los bundles sólo se incorpora `API_BASE_URL=/api`. El Dockerfile genera el `.env` de compilación y usa `WEB_BASE_PATH=/customer` o `/owner`. Babel incorpora esa configuración al exportar. Una URL de API distinta exige reconstruir ambos bundles y actualizar CSP/CORS si cambia el origen.

## Migraciones, datos y actualizaciones

`npm run start:production` verifica MariaDB, ejecuta `db:migrate` hacia adelante y arranca Express. Si no conecta, termina con error. Con `SEED_DEMO=true`, Sequelize registra cada seeder completado en `SequelizeData`. Una base con usuarios y sin esos metadatos se rechaza para evitar sembrarla accidentalmente. La receta de reset local `npm run migrate` queda bloqueada con `NODE_ENV=production`.

Después de la primera instalación, deja `SEED_DEMO=false`. Cada despliegue conserva los volúmenes y ejecuta sólo migraciones pendientes. La demo usa IDs de ejemplo de una base vacía. Para ampliar los datos de una instalación existente, usa una migración específica.

Antes de actualizar, crea una copia consistente de MariaDB con `mariadb-dump --single-transaction` y una copia del volumen de uploads. Usa las herramientas privadas del proveedor y guarda las copias fuera del repositorio. Conserva ambos volúmenes al reiniciar o redesplegar. Restaurar código no revierte migraciones de datos. Comprueba compatibilidad antes de volver a una imagen anterior.

Las pruebas E2E y los resets se ejecutan exclusivamente sobre una base local desechable. Para actualizar producción, publica un commit revisado, despliega ese SHA, espera el health check y verifica sesión, pedidos e imágenes. Etiqueta el release después de comprobar el despliegue.

## Demo pública y límites

Las cuentas compartidas son `customer1@customer.com` y `owner1@owner.com`, con contraseña `secret`. Sus perfiles y su borrado están bloqueados. Los accesos concurrentes de la misma cuenta comparten su sesión vigente. Se permite registrar clientes y propietarios propios para probar con datos ficticios.

Los pedidos son de demostración y no tienen cobro. Usa datos ficticios. El propietario ve pedidos de sus restaurantes y puede avanzar su preparación, envío y entrega. El cliente sólo puede editar o cancelar pedidos pendientes. Un subtotal desde 10 € tiene envío gratuito al crear y editar.

Hay un límite de 180 peticiones de API por IP y minuto, 30 solicitudes de acceso o registro por IP cada 15 minutos, y archivos PNG/JPEG de menos de 2 MB. Los recursos estáticos y el health check quedan fuera del límite general. Las cuentas compartidas permiten modificar el mismo catálogo de ejemplo, por lo que varios visitantes pueden ver cambios de otros visitantes. El panel de control adicional sigue siendo provisional.

## Alojamiento y coste

Se usan dos servicios y dos volúmenes de 500 MB en Railway, ajustados al límite disponible de la cuenta. El consumo se descuenta del crédito o se factura según el plan activo. La prueba inicial ofrece hasta 5 USD durante 30 días. Al agotarla, el plan Free aporta 1 USD mensual. Su continuidad depende del consumo. Railway puede eliminar los volúmenes de Trial 30 días después de expirar sus créditos.

Hobby tiene un mínimo de 5 USD/mes, que incluye 5 USD de consumo. Los recursos adicionales se facturan por uso. No hay garantía de alojamiento gratuito permanente. Las tarifas y el estado de la cuenta deben comprobarse antes de contratar o ampliar el plan.

[Condiciones de la prueba](https://docs.railway.com/pricing/free-trial) · [Tarifas vigentes](https://docs.railway.com/pricing/plans)
