# DeliverUS

DeliverUS es un proyecto colaborativo de pedidos de restaurantes.

[Abrir app de clientes](https://nicodalba.github.io/deliverus/customer/) · [Abrir app de propietarios](https://nicodalba.github.io/deliverus/owner/)

La publicación es una **demo estática gratuita** de las dos aplicaciones originales. Usa las cuentas de ejemplo de abajo. Los pedidos y las ediciones se guardan sólo en el navegador que uses y se conservan al recargar. Cliente y propietario comparten esa copia local. Usa datos ficticios. «Restaurar demo» recupera el catálogo inicial.

[Construcción y publicación](./DEPLOYMENT.md) · [Presentación del proyecto](https://nicodalba.github.io/deliverus/)

| Carpeta | Aplicación |
| --- | --- |
| `DeliverUS-Backend` | API REST de Express con Sequelize y MariaDB para usuarios, restaurantes, productos y pedidos. |
| `DeliverUS-Frontend-Customer` | Catálogo, filtros, menús, perfil e historial de pedidos del cliente. |
| `DeliverUS-Frontend-Owner` | Perfil y gestión de restaurantes y productos del propietario. |

## Aplicación conectada en local

Para ejecutar Express, MariaDB y las apps conectadas, sigue estos pasos.

Necesitas Node.js 24 LTS con npm y MariaDB en local. Se comprobó con MariaDB 11.4.

Crea una base desechable y un usuario limitado a esa base. Ejecuta este SQL con el administrador local de MariaDB.

```sql
CREATE DATABASE deliverus_sandbox CHARACTER SET utf8mb4;
CREATE USER 'deliverus_local'@'127.0.0.1' IDENTIFIED BY 'deliverus_local_demo';
GRANT ALL PRIVILEGES ON deliverus_sandbox.* TO 'deliverus_local'@'127.0.0.1';
```

Desde la raíz del proyecto, arranca el backend. Si ya tienes un `.env`, conserva el archivo y verifica que apunta a la base desechable y al puerto correcto. **`npm run migrate` revierte todas las migraciones antes de recrear y sembrar la base.**

```sh
cd DeliverUS-Backend
cp -n .env.example .env
npm ci
npm run migrate
node src/backend.js
```

Comprueba que el catálogo devuelve datos con `curl -fsS http://localhost:3000/restaurants`.

En dos terminales, desde la raíz, arranca los frontends. Ambos `.env.example` apuntan a la API local.

```sh
cd DeliverUS-Frontend-Customer
cp -n .env.example .env
npm ci
npx expo start --web --localhost --port 8081
```

```sh
cd DeliverUS-Frontend-Owner
cp -n .env.example .env
npm ci
npx expo start --web --localhost --port 8082
```

Abre Customer en `http://localhost:8081` y Owner en `http://localhost:8082`. Para exportar cualquiera de las dos aplicaciones web, ejecuta `npx expo export -p web` en su carpeta.

| Cuenta de prueba local | Correo | Contraseña |
| --- | --- | --- |
| Cliente | `customer1@customer.com` | `secret` |
| Propietario | `owner1@owner.com` | `secret` |

## Pruebas

Con la API detenida y MariaDB activa, ejecuta desde `DeliverUS-Backend` y contra la base desechable.

```sh
npm run migrate
npm test -- --runInBand
```

Vuelve a sembrar esa base antes de una demostración manual para restaurar los datos de ejemplo.

## Límites conocidos

- El envío es gratuito desde 10 € tanto al crear como al editar pedidos.
- Las cuentas y perfiles de la demo estática son fijos. Cada perfil del navegador tiene su propio estado.
- Owner incluye una vista de pedidos por restaurante con preparación, envío y entrega. El panel adicional sigue siendo provisional.
- La demo pública guarda los cambios en el navegador. La aplicación con base de datos compartida requiere el arranque local indicado arriba.

## Créditos y licencia

DeliverUS es obra de sus colaboradores originales. Créditos según los nombres y alias usados en sus contribuciones: lacatu5, AlexMG-05, NicodAlba, aurbinat, BlitzAlexx y SrAlex73.

El backend conserva su [aviso CC0 1.0](./DeliverUS-Backend/LICENSE). Los demás componentes y recursos conservan sus derechos y avisos aplicables.
