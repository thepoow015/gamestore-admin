/* =========================================================
   data.js — Fuente central de datos iniciales (ficticios)
   Se copian a LocalStorage la primera vez que se abre la app.
   ========================================================= */
const SEED = (() => {
    const PLATAFORMAS = ['PlayStation 5', 'PlayStation 4', 'Xbox Series', 'Xbox One', 'Nintendo Switch', 'PC'];
    const METODOS_PAGO = ['Tarjeta', 'Transferencia', 'PayPal', 'Efectivo'];
    const ESTADOS_PEDIDO = ['Completado', 'Procesando', 'Pendiente', 'Enviado', 'Cancelado'];

    const categories = [
        { id: 1, nombre: 'Acción', descripcion: 'Combate intenso, exploración y mucha adrenalina.', icono: 'bi-lightning-charge', estado: 'Activa' },
        { id: 2, nombre: 'Aventura', descripcion: 'Mundos abiertos, historias y narrativa inmersiva.', icono: 'bi-compass', estado: 'Activa' },
        { id: 3, nombre: 'RPG', descripcion: 'Rol, progresión de personajes y decisiones con peso.', icono: 'bi-shield', estado: 'Activa' },
        { id: 4, nombre: 'Shooter', descripcion: 'Disparos en primera y tercera persona, modos online.', icono: 'bi-crosshair', estado: 'Activa' },
        { id: 5, nombre: 'Deportes', descripcion: 'Fútbol, baloncesto y simuladores deportivos.', icono: 'bi-trophy', estado: 'Activa' },
        { id: 6, nombre: 'Carreras', descripcion: 'Conducción arcade y simulación automovilística.', icono: 'bi-speedometer', estado: 'Activa' },
        { id: 7, nombre: 'Terror', descripcion: 'Survival horror y experiencias de suspenso.', icono: 'bi-moon-stars', estado: 'Activa' },
        { id: 8, nombre: 'Estrategia', descripcion: 'Gestión de recursos, tácticas y construcción de imperios.', icono: 'bi-diagram-3', estado: 'Activa' },
        { id: 9, nombre: 'Simulación', descripcion: 'Vida virtual, construcción y gestión creativa.', icono: 'bi-house', estado: 'Activa' }
    ];

    // id, nombre, categoria, plataforma, precio, anterior, stock, min, sku, dev, publisher, año, vendidos, descripcion
    const P = (id, nombre, categoria, plataforma, precio, precioAnterior, stock, stockMinimo, sku, desarrollador, publisher, lanzamiento, vendidos, descripcion, creado) => ({
        id, nombre, descripcion, categoria, plataforma, precio, precioAnterior, stock, stockMinimo, sku,
        desarrollador, publisher, lanzamiento, imagen: '', estado: '', activo: true, vendidos, creado, actualizado: creado
    });

    const products = [
        P(1, 'Grand Theft Auto V', 'Acción', 'PlayStation 5', 1899, 2499, 3, 10, 'GTA5-PS5-001', 'Rockstar North', 'Rockstar Games', 2013, 312, 'Tres protagonistas, un mapa gigante y el crimen organizado de Los Santos en versión mejorada para PS5.', '2026-01-08'),
        P(2, 'God of War Ragnarök', 'Acción', 'PlayStation 5', 3600, 3900, 24, 10, 'GOWR-PS5-002', 'Santa Monica Studio', 'Sony Interactive Entertainment', 2022, 268, 'Kratos y Atreus recorren los nueve reinos mientras se acerca el fin del mundo nórdico.', '2026-01-12'),
        P(3, 'EA Sports FC 26', 'Deportes', 'PlayStation 5', 3499, 0, 0, 10, 'FC26-PS5-003', 'EA Vancouver', 'Electronic Arts', 2025, 245, 'La nueva entrega del simulador de fútbol con ligas licenciadas y modo Carrera renovado.', '2026-01-20'),
        P(4, 'Call of Duty: Black Ops 7', 'Shooter', 'Xbox Series', 3799, 0, 18, 10, 'COD7-XBS-004', 'Treyarch', 'Activision', 2025, 221, 'Campaña de espionaje, multijugador competitivo y modo Zombis cooperativo.', '2026-02-02'),
        P(5, 'Minecraft', 'Aventura', 'Nintendo Switch', 1499, 1799, 2, 10, 'MINE-NSW-005', 'Mojang Studios', 'Xbox Game Studios', 2011, 198, 'Construye, explora y sobrevive en mundos infinitos generados proceduralmente.', '2026-02-05'),
        P(6, 'Red Dead Redemption 2', 'Aventura', 'PlayStation 4', 2299, 2999, 15, 10, 'RDR2-PS4-006', 'Rockstar Games', 'Rockstar Games', 2018, 154, 'Arthur Morgan y la banda de Van der Linde en el ocaso del Salvaje Oeste.', '2026-02-18'),
        P(7, 'The Last of Us Part I', 'Aventura', 'PlayStation 5', 3299, 3699, 9, 10, 'TLOU1-PS5-007', 'Naughty Dog', 'Sony Interactive Entertainment', 2022, 132, 'La historia de Joel y Ellie reconstruida con gráficos y jugabilidad modernos.', '2026-02-25'),
        P(8, 'Mortal Kombat 1', 'Acción', 'Xbox Series', 2999, 3599, 14, 10, 'MK1-XBS-008', 'NetherRealm Studios', 'Warner Bros. Games', 2023, 118, 'El reinicio de la saga de peleas con nuevos Kameo y una nueva línea temporal.', '2026-03-03'),
        P(9, "Marvel's Spider-Man 2", 'Acción', 'PlayStation 5', 3699, 3899, 21, 10, 'SPM2-PS5-009', 'Insomniac Games', 'Sony Interactive Entertainment', 2023, 176, 'Peter Parker y Miles Morales se enfrentan a Venom en una Nueva York ampliada.', '2026-03-10'),
        P(10, 'Resident Evil 4', 'Terror', 'PC', 2199, 2799, 7, 10, 'RE4-PC-010', 'Capcom', 'Capcom', 2023, 109, 'Remake del clásico de survival horror con Leon S. Kennedy en la Europa rural.', '2026-03-16'),
        P(11, 'Hogwarts Legacy', 'RPG', 'PlayStation 5', 2899, 3499, 17, 10, 'HOGL-PS5-011', 'Avalanche Software', 'Warner Bros. Games', 2023, 143, 'Vive tu propia historia en Hogwarts durante el siglo XIX con magia y exploración.', '2026-03-22'),
        P(12, 'Gran Turismo 7', 'Carreras', 'PlayStation 5', 3099, 3399, 12, 10, 'GT7-PS5-012', 'Polyphony Digital', 'Sony Interactive Entertainment', 2022, 87, 'Más de 400 autos, circuitos legendarios y un modo Café lleno de historia automovilística.', '2026-04-01'),
        P(13, 'Forza Horizon 5', 'Carreras', 'Xbox Series', 2699, 2999, 22, 10, 'FH5-XBS-013', 'Playground Games', 'Xbox Game Studios', 2021, 96, 'Festival de autos en un México vibrante con eventos dinámicos y clima extremo.', '2026-04-09'),
        P(14, 'Elden Ring', 'RPG', 'PC', 2599, 2999, 0, 10, 'ELDR-PC-014', 'FromSoftware', 'Bandai Namco', 2022, 164, 'Un vasto mundo abierto creado junto a George R. R. Martin con combate exigente.', '2026-04-15'),
        P(15, 'The Legend of Zelda: Tears of the Kingdom', 'Aventura', 'Nintendo Switch', 3399, 0, 26, 10, 'ZTOK-NSW-015', 'Nintendo EPD', 'Nintendo', 2023, 187, 'Link explora Hyrule, sus cielos y profundidades con nuevas habilidades de construcción.', '2026-04-28'),
        P(16, 'Age of Empires IV', 'Estrategia', 'PC', 1999, 2499, 31, 8, 'AOE4-PC-016', 'Relic Entertainment', 'Xbox Game Studios', 2021, 64, 'Estrategia en tiempo real con ocho civilizaciones y campañas históricas.', '2026-05-06'),
        P(17, 'The Sims 4', 'Simulación', 'PC', 999, 1499, 40, 8, 'SIMS4-PC-017', 'Maxis', 'Electronic Arts', 2014, 72, 'Crea personajes, diseña casas y cuenta tus propias historias de vida.', '2026-05-14')
    ];

    const C = (id, nombre, telefono, direccion, registro, estado) => ({
        id, nombre, telefono, direccion, registro, estado,
        email: nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '.') + '@example.com'
    });
    const customers = [
        C(1, 'Steven Martínez', '+1 (809) 555-0101', 'Av. Winston Churchill 45, Santo Domingo', '2025-02-14', 'Activo'),
        C(2, 'Laura Fernández', '+1 (809) 555-0102', 'Calle Duarte 120, Santiago', '2025-03-02', 'Activo'),
        C(3, 'Carlos Peña', '+1 (829) 555-0103', 'Calle Mella 8, La Vega', '2025-03-19', 'Activo'),
        C(4, 'Ana Rodríguez', '+1 (849) 555-0104', 'Av. 27 de Febrero 310, Santo Domingo', '2025-04-07', 'Activo'),
        C(5, 'Miguel Santana', '+1 (809) 555-0105', 'Calle El Conde 22, Zona Colonial', '2025-05-11', 'Activo'),
        C(6, 'Valeria Núñez', '+1 (829) 555-0106', 'Residencial Los Ríos, Torre B, Apt. 4C', '2025-06-23', 'Activo'),
        C(7, 'José Almonte', '+1 (809) 555-0107', 'Calle Restauración 77, San Cristóbal', '2025-07-30', 'Activo'),
        C(8, 'Camila Reyes', '+1 (849) 555-0108', 'Av. Estrella Sadhalá 190, Santiago', '2025-09-04', 'Activo'),
        C(9, 'Daniel Ortiz', '+1 (809) 555-0109', 'Calle Sánchez 63, Puerto Plata', '2025-10-17', 'Activo'),
        C(10, 'Patricia Gómez', '+1 (829) 555-0110', 'Av. Bolívar 505, Santo Domingo', '2025-11-26', 'Activo'),
        C(11, 'Rafael Batista', '+1 (809) 555-0111', 'Calle Palo Hincado 31, San Pedro de Macorís', '2026-01-09', 'Bloqueado'),
        C(12, 'Sofía Jiménez', '+1 (849) 555-0112', 'Calle Beller 14, Santiago', '2026-02-21', 'Inactivo')
    ];

    // [clienteId, [[productoId, cantidad]...], pago, estado] para los pedidos GS-1001 … GS-1024
    const specs = [
        [3, [[2, 1]], 'Tarjeta', 'Completado'], [5, [[1, 1], [5, 1]], 'Efectivo', 'Completado'],
        [2, [[3, 1]], 'PayPal', 'Completado'], [8, [[4, 1], [17, 1]], 'Tarjeta', 'Completado'],
        [1, [[9, 1]], 'Transferencia', 'Completado'], [10, [[12, 1]], 'Tarjeta', 'Completado'],
        [4, [[6, 2]], 'Efectivo', 'Completado'], [7, [[10, 1], [16, 1]], 'PayPal', 'Completado'],
        [6, [[11, 1]], 'Tarjeta', 'Completado'], [9, [[13, 1], [15, 1]], 'Transferencia', 'Completado'],
        [12, [[17, 3]], 'Efectivo', 'Cancelado'], [2, [[14, 1]], 'Tarjeta', 'Completado'],
        [3, [[7, 1], [8, 1]], 'Tarjeta', 'Completado'], [11, [[1, 2]], 'Efectivo', 'Completado'],
        [5, [[15, 1]], 'PayPal', 'Enviado'], [8, [[9, 1], [2, 1]], 'Tarjeta', 'Completado'],
        [1, [[4, 1]], 'Transferencia', 'Completado'], [10, [[5, 2], [1, 1]], 'Efectivo', 'Enviado'],
        [6, [[3, 1]], 'Tarjeta', 'Enviado'], [9, [[8, 1]], 'PayPal', 'Cancelado'],
        [4, [[12, 1], [13, 1]], 'Transferencia', 'Pendiente'], [7, [[16, 2]], 'Tarjeta', 'Procesando'],
        [2, [[9, 1]], 'Transferencia', 'Enviado'], [1, [[2, 2]], 'Tarjeta', 'Completado']
    ];

    const orders = specs.map(([clienteId, lines, pago, estado], i) => {
        const num = 1001 + i;
        const items = lines.map(([pid, cantidad]) => {
            const p = products.find(x => x.id === pid);
            return { productId: pid, nombre: p.nombre, cantidad, precio: p.precio };
        });
        const subtotal = items.reduce((s, it) => s + it.cantidad * it.precio, 0);
        const envio = subtotal >= 5000 ? 0 : 250;
        const descuento = subtotal >= 8000 ? Math.round(subtotal * 0.05) : 0;
        const d = new Date(Date.UTC(2026, 9, 4) - (1024 - num) * 4 * 86400000);
        return {
            id: 'GS-' + num, clienteId, fecha: d.toISOString().slice(0, 10), items,
            subtotal, envio, descuento, total: subtotal + envio - descuento, pago, estado
        };
    });

    const ago = (min) => new Date(Date.now() - min * 60000).toISOString();
    const notifications = [
        { id: 1, tipo: 'stock', texto: 'Producto con stock bajo: Grand Theft Auto V (3 unidades).', fecha: ago(12), leida: false },
        { id: 2, tipo: 'pedido', texto: 'Nuevo pedido recibido: #GS-1022.', fecha: ago(95), leida: false },
        { id: 3, tipo: 'cliente', texto: 'Nuevo cliente registrado: Sofía Jiménez.', fecha: ago(240), leida: false },
        { id: 4, tipo: 'pedido', texto: 'Pedido #GS-1024 completado.', fecha: ago(1500), leida: true },
        { id: 5, tipo: 'stock', texto: 'EA Sports FC 26 está agotado.', fecha: ago(2900), leida: true }
    ];

    const user = {
        nombre: 'Steven Mendez', email: 'admin@gamestore.com', telefono: '+1 (809) 555-0142',
        rol: 'Administrador', registro: '2025-01-15', password: '123456'
    };

    const settings = {
        tienda: { nombre: 'GameStore', email: 'contacto@gamestore.example.com', telefono: '+1 (809) 555-0100', direccion: 'Av. Abraham Lincoln 1020, Santo Domingo, República Dominicana' },
        tema: 'dark',
        logo: '',
        notif: { pedidos: true, stock: true, clientes: true }
    };

    // Cifras de demostración para el Dashboard y Reportes (serie histórica ficticia)
    const demo = {
        ventasBase: 485750, pedidosBase: 1248, clientesBase: 3642,
        kpiPeriodos: {
            7: { label: 'Últimos 7 días', ventas: 183200, delta: 9.8, comparacion: 'vs. semana anterior' },
            30: { label: 'Últimos 30 días', ventas: 485750, delta: 12.5, comparacion: 'vs. mes anterior' },
            90: { label: 'Últimos 90 días', ventas: 1296750, delta: 15.3, comparacion: 'vs. trimestre anterior' }
        },
        series: {
            '7d': { labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], data: [18200, 22400, 19800, 25100, 31200, 38900, 27600], titulo: 'Últimos 7 días' },
            '30d': { labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'], data: [98200, 112400, 121800, 153350], titulo: 'Últimos 30 días' },
            '6m': { labels: ['Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio'], data: [312500, 298400, 354200, 389700, 421300, 485750], titulo: 'Últimos 6 meses' },
            '7m': { labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio'], data: [286000, 312500, 298400, 354200, 389700, 421300, 485750], titulo: 'Últimos 7 meses' },
            '1y': { labels: ['Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'], data: [201500, 214800, 233600, 298900, 356400, 286000, 312500, 298400, 354200, 389700, 421300, 485750], titulo: 'Último año' }
        },
        mensual: {
            meses: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio'],
            ventas: [286000, 312500, 298400, 354200, 389700, 421300, 485750],
            pedidos: [142, 160, 155, 178, 190, 205, 218]
        }
    };

    return { categories, products, customers, orders, notifications, user, settings, demo, PLATAFORMAS, METODOS_PAGO, ESTADOS_PEDIDO };
})();
