# GameStore Admin

Panel administrativo moderno para una tienda ficticia de videojuegos, construido con HTML, CSS, Bootstrap 5 y JavaScript vanilla. Funciona 100 % en el navegador: los datos se guardan en LocalStorage, sin backend.

> Proyecto de portafolio frontend. Todos los datos (productos, clientes, pedidos) son ficticios.

## Características

- Login simulado con protección de páginas (no es seguridad real).
- Dashboard con KPIs, gráfico de ventas, ventas por categoría, pedidos recientes, más vendidos y alertas de inventario.
- CRUD completo de productos, categorías y clientes; creación y gestión de pedidos.
- Búsqueda, filtros, ordenamiento y paginación funcionales.
- Selección múltiple con acciones masivas (activar, desactivar, eliminar).
- Inventario con estadísticas calculadas y ajuste de stock con motivo.
- Reportes con Chart.js y exportación a CSV.
- Búsqueda global (productos, clientes y pedidos) y notificaciones.
- Modo claro / oscuro con preferencia guardada.
- Impresión del detalle de pedido (`window.print()` con estilos de impresión).
- Diseño responsive: sidebar fijo en escritorio y offcanvas en móvil.
- Estados de UI: carga, vacío, error con reintento, éxito y advertencia.
- Imágenes con fallback: si una portada falla o no existe, se genera una automáticamente.

## Tecnologías

- HTML5 semántico
- CSS3 con variables (`css/style.css`, `css/responsive.css`)
- Bootstrap 5 y Bootstrap Icons
- JavaScript Vanilla ES6+
- SweetAlert2
- Chart.js
- Google Fonts (Inter y Space Grotesk)

## Funcionalidades

| Módulo | Qué incluye |
| --- | --- |
| Dashboard | KPIs dinámicos, gráficos, pedidos recientes, alertas |
| Productos | CRUD, filtros, orden, paginación, detalle, acciones masivas |
| Categorías | CRUD con validación (no se elimina si tiene productos) |
| Clientes | CRUD, filtros, detalle con historial de pedidos |
| Pedidos | Filtros, nuevo pedido, cambio de estado, cancelación, impresión |
| Inventario | Estadísticas, filtros, ajuste de stock |
| Reportes | Ventas, pedidos, productos, clientes e inventario + CSV |
| Configuración | Datos de tienda, tema, logo, notificaciones, contraseña |
| Perfil | Datos del administrador y edición |

## Capturas

<!-- Agrega tus capturas en img/ y enlázalas aquí -->
| Login | Dashboard |
| --- | --- |
| _(captura)_ | _(captura)_ |

| Productos | Reportes |
| --- | --- |
| _(captura)_ | _(captura)_ |

## Demo

<!-- Reemplaza con tu URL cuando publiques en GitHub Pages -->
`https://TU-USUARIO.github.io/gamestore-admin/`

Credenciales de demostración:

- Email: `admin@gamestore.com`
- Contraseña: `123456`

## Instalación

No requiere instalación ni Node.js.

1. Clona o descarga el repositorio:
   ```bash
   git clone https://github.com/TU-USUARIO/gamestore-admin.git
   ```
2. Abre `index.html` en tu navegador (o sírvelo con cualquier servidor estático).

### Publicar en GitHub Pages

1. Sube el proyecto a un repositorio llamado `gamestore-admin`.
2. En *Settings → Pages* elige la rama `main` y la carpeta `/ (root)`.
3. Todas las rutas son relativas, por lo que funciona dentro de `/gamestore-admin/`.

## Estructura

```text
gamestore-admin/
├── index.html
├── login.html
├── pages/        # dashboard, productos, categorías, clientes, pedidos, inventario, reportes, configuración, perfil
├── css/          # style.css, responsive.css
├── js/           # app, data, storage, auth, ui, notifications y un módulo por sección
└── img/logo/     # favicon
```

Los datos iniciales viven en `js/data.js` y se copian a LocalStorage (`gamestore_*`) la primera vez. Desde *Configuración → Restablecer datos* puedes volver al estado original.

## Autor

Steven Mendez

## Propósito

Proyecto de portafolio frontend para demostrar interfaces, dashboards, tablas, formularios, CRUD, filtros, almacenamiento local, gráficos y diseño responsive.
