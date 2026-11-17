# Publicación gratuita

La publicación usa GitHub Pages desde `main` y `/docs`. Customer y Owner son exportaciones web de las aplicaciones Expo originales. La demo estática se activa al compilar con `EXPO_PUBLIC_STATIC_DEMO=true`.

Los datos iniciales están en `demo/catalog.json`. Proceden del catálogo de ejemplo de una instalación limpia del backend. `demo/staticApi.js` adapta las operaciones de las interfaces al almacenamiento del navegador. La sesión de cada rol tiene su propia clave. Ambos roles comparten los datos de la demo en el mismo origen y perfil de navegador.

## Reconstruir

Con Node 24 LTS y npm, desde la raíz del repositorio.

```sh
sh scripts/build-static-demo.sh
```

El script instala con `npm ci`, exporta cada aplicación y actualiza `docs/customer/`, `docs/owner/` y `docs/demo-assets/`. No requiere MariaDB para compilar. Usa estas variables públicas de compilación.

| Variable | Valor |
| --- | --- |
| `API_BASE_URL` | `/deliverus` |
| `EXPO_PUBLIC_STATIC_DEMO` | `true` |
| `EXPO_PUBLIC_APP_ROOT` | `/deliverus` |
| `WEB_BASE_PATH` | `/deliverus/customer` o `/deliverus/owner` |

Los prefijos se configuran en `app.config.js` y Metro incluye el código compartido de `demo/`. Babel incorpora `API_BASE_URL` al bundle. Si cambias el nombre del repositorio o el prefijo público, actualiza el script y reconstruye ambas apps.

Para comprobar las rutas desde un servidor estático local.

```sh
preview=$(mktemp -d)
ln -s "$PWD/docs" "$preview/deliverus"
python3 -m http.server 8000 --bind 127.0.0.1 --directory "$preview"
```

Abre `http://127.0.0.1:8000/deliverus/`. Prueba ambas apps, recarga y cambia de rol. Los pedidos y las imágenes de prueba deben permanecer en ese perfil del navegador. El botón «Restaurar demo» borra ese estado y recupera el catálogo inicial.

Publica los archivos exportados mediante un commit revisado. GitHub Pages mantiene las rutas `/deliverus/customer/` y `/deliverus/owner/`. La navegación interna usa React Navigation. Al recargar se abre la pantalla inicial y se recupera la sesión del rol. Los archivos JavaScript e imágenes inexistentes devuelven 404.

## Alcance y coste

La publicación es un ejemplo interactivo estático. Los pedidos, cambios de catálogo e imágenes añadidas se guardan en el almacenamiento local del navegador. Se conservan al recargar y al actualizar la web mientras se mantengan ese almacenamiento y la versión de su esquema. Otros dispositivos y perfiles tienen su propia copia. Borrar los datos del sitio o usar «Restaurar demo» elimina los cambios locales.

Las cuentas son fijas y se anuncian dentro de la demo. El registro y la edición de credenciales quedan fuera del modo estático. Las imágenes añadidas se limitan a PNG/JPEG de menos de 2 MB y al espacio disponible del navegador.

GitHub Pages sirve archivos estáticos desde el repositorio público, con el plan gratuito de GitHub y sus cuotas. Este despliegue carece de suscripciones de infraestructura, API alojada o base de datos facturada. Si se supera una cuota del proveedor, habrá que reducir el uso o revisar el alojamiento. La API Express y MariaDB se conservan para ejecutar la aplicación conectada en local.

[Condiciones de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
