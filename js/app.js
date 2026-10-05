/* =========================================================
   app.js — Estructura compartida: sidebar, navbar, footer,
   tema claro/oscuro, búsqueda global y protección de páginas.
   ========================================================= */
const GS = (() => {
    const body = document.body;
    const state = { blocked: false };

    DB.init();

    // Redirige al login si no hay sesión (simulación frontend)
    if (body.dataset.public !== 'true' && !Auth.isLoggedIn()) {
        state.blocked = true;
        document.documentElement.style.visibility = 'hidden';
        location.replace((body.dataset.root || '') + 'login.html');
    }

    const ready = (fn) => { if (!state.blocked) fn(); };

    /* ---------- Tema ---------- */
    const getTheme = () => document.documentElement.dataset.bsTheme || 'dark';
    function setTheme(theme) {
        document.documentElement.dataset.bsTheme = theme;
        try { localStorage.setItem('gamestore_theme', theme); } catch (e) { /* ignorar */ }
        const btn = document.getElementById('themeToggle');
        if (btn) {
            btn.innerHTML = `<i class="bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon-stars'}"></i>`;
            btn.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
            btn.title = theme === 'dark' ? 'Modo claro' : 'Modo oscuro';
        }
        document.dispatchEvent(new CustomEvent('gs:theme', { detail: theme }));
    }

    /* ---------- Layout ---------- */
    const NAV = [
        { id: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2', href: 'dashboard.html' },
        { id: 'productos', label: 'Productos', icon: 'bi-controller', href: 'productos.html' },
        { id: 'categorias', label: 'Categorías', icon: 'bi-grid', href: 'categorias.html' },
        { id: 'pedidos', label: 'Pedidos', icon: 'bi-bag', href: 'pedidos.html' },
        { id: 'clientes', label: 'Clientes', icon: 'bi-people', href: 'clientes.html' },
        { id: 'inventario', label: 'Inventario', icon: 'bi-box-seam', href: 'inventario.html' },
        { id: 'reportes', label: 'Reportes', icon: 'bi-bar-chart', href: 'reportes.html' }
    ];
    const SYSTEM = [
        { id: 'configuracion', label: 'Configuración', icon: 'bi-gear', href: 'configuracion.html' },
        { id: 'perfil', label: 'Mi perfil', icon: 'bi-person-circle', href: 'perfil.html' }
    ];
    const link = (it, page) => `<a class="nav-link-gs ${it.id === page ? 'active' : ''}" href="${it.href}" ${it.id === page ? 'aria-current="page"' : ''}><i class="bi ${it.icon}" aria-hidden="true"></i>${it.label}</a>`;

    function buildSidebar(page, user, settings) {
        const logo = settings.logo ? `<img src="${UI.esc(settings.logo)}" alt="Logo de la tienda">` : '<i class="bi bi-controller" aria-hidden="true"></i>';
        return `<aside class="sidebar offcanvas-lg offcanvas-start" tabindex="-1" id="sidebar" aria-label="Navegación principal">
            <div class="offcanvas-header d-lg-none"><span class="text-muted small">Menú</span><button type="button" class="btn-close" data-bs-dismiss="offcanvas" data-bs-target="#sidebar" aria-label="Cerrar menú"></button></div>
            <div class="offcanvas-body">
                <a class="brand" href="dashboard.html" aria-label="GameStore Admin"><span class="brand-icon">${logo}</span><span class="brand-text">${UI.esc(settings.tienda.nombre || 'GameStore')}<small>Admin</small></span></a>
                <nav aria-label="Secciones"><div class="nav-label">Navegación</div>${NAV.map((i) => link(i, page)).join('')}
                <div class="nav-label">Sistema</div>${SYSTEM.map((i) => link(i, page)).join('')}</nav>
                <div class="sidebar-spacer"></div>
                <div class="sidebar-user"><span class="avatar" aria-hidden="true">${UI.esc(UI.initials(user.nombre))}</span>
                    <div class="info"><strong>${UI.esc(user.nombre)}</strong><span>${UI.esc(user.rol)}</span></div>
                    <button type="button" class="btn-icon danger" data-action="logout" aria-label="Cerrar sesión" title="Cerrar sesión"><i class="bi bi-box-arrow-right"></i></button></div>
            </div></aside>`;
    }

    function buildNavbar(user) {
        const title = body.dataset.title || 'Dashboard';
        const parent = body.dataset.parent; // detalle → listado
        const parentItem = NAV.find((n) => n.id === parent);
        const crumbs = `<li class="breadcrumb-item d-none d-sm-block"><a href="dashboard.html">GameStore</a></li>
            ${parentItem ? `<li class="breadcrumb-item d-none d-sm-block"><a href="${parentItem.href}">${parentItem.label}</a></li>` : ''}
            <li class="breadcrumb-item active" aria-current="page">${UI.esc(title)}</li>`;
        return `<header class="app-navbar">
            <button class="icon-btn d-lg-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebar" aria-controls="sidebar" aria-label="Abrir menú"><i class="bi bi-list fs-5"></i></button>
            <nav aria-label="breadcrumb"><ol class="breadcrumb mb-0">${crumbs}</ol></nav>
            <div class="nav-spacer"></div>
            <div class="search-box" id="searchBox" role="search"><i class="bi bi-search" aria-hidden="true"></i>
                <input type="search" class="form-control" id="globalSearch" placeholder="Buscar productos, clientes, pedidos…" aria-label="Búsqueda global" autocomplete="off">
                <div class="search-results" id="searchResults" role="listbox"></div></div>
            <button class="icon-btn mobile-search-btn" type="button" id="mobileSearchBtn" aria-label="Buscar"><i class="bi bi-search"></i></button>
            <button class="icon-btn" type="button" id="themeToggle"></button>
            <div class="dropdown"><button class="icon-btn" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false" aria-label="Notificaciones"><i class="bi bi-bell"></i><span class="notif-dot d-none" id="notifBadge">0</span></button>
                <div class="dropdown-menu dropdown-menu-end notif-menu"><div class="notif-head"><div><strong>Notificaciones</strong><br><small class="text-muted" id="notifCount"></small></div>
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="notifRead"><i class="bi bi-check2-all"></i> Marcar leídas</button></div>
                    <div class="notif-list" id="notifList"></div></div></div>
            <div class="dropdown"><button class="btn p-0 border-0 d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Menú de perfil">
                <span class="avatar" aria-hidden="true">${UI.esc(UI.initials(user.nombre))}</span><span class="d-none d-xl-inline small fw-semibold">${UI.esc(user.nombre.split(' ')[0])}</span></button>
                <ul class="dropdown-menu dropdown-menu-end"><li><h6 class="dropdown-header">${UI.esc(user.nombre)}</h6></li>
                    <li><a class="dropdown-item" href="perfil.html"><i class="bi bi-person-circle me-2"></i>Mi perfil</a></li>
                    <li><a class="dropdown-item" href="configuracion.html"><i class="bi bi-gear me-2"></i>Configuración</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><button class="dropdown-item text-danger" type="button" data-action="logout"><i class="bi bi-box-arrow-right me-2"></i>Cerrar sesión</button></li></ul></div>
        </header>`;
    }

    const buildFooter = () => `<footer class="app-footer"><span>GameStore Admin · © 2026</span><span>Proyecto desarrollado para portafolio.</span></footer>`;

    /* ---------- Búsqueda global ---------- */
    function initSearch() {
        const input = document.getElementById('globalSearch');
        const box = document.getElementById('searchResults');
        const wrap = document.getElementById('searchBox');
        const close = () => { box.classList.remove('show'); box.innerHTML = ''; };

        const run = () => {
            const q = input.value.trim().toLowerCase();
            if (q.length < 2) return close();
            const customers = DB.get('customers');
            const products = DB.get('products').filter((p) => [p.nombre, p.sku, p.categoria].some((v) => String(v).toLowerCase().includes(q))).slice(0, 4);
            const clientes = customers.filter((c) => [c.nombre, c.email].some((v) => v.toLowerCase().includes(q))).slice(0, 4);
            const pedidos = DB.get('orders').filter((o) => {
                const c = customers.find((x) => x.id === o.clienteId);
                return o.id.toLowerCase().includes(q) || (c && c.nombre.toLowerCase().includes(q));
            }).slice(0, 4);
            let html = '';
            if (products.length) html += `<div class="search-group">Productos</div>${products.map((p) => `<a class="search-item" href="producto-detalle.html?id=${p.id}">${UI.img(p, 'mini')}<span>${UI.esc(p.nombre)}<small>${UI.esc(p.plataforma)} · ${UI.money(p.precio)}</small></span></a>`).join('')}`;
            if (clientes.length) html += `<div class="search-group">Clientes</div>${clientes.map((c) => `<a class="search-item" href="cliente-detalle.html?id=${c.id}"><span class="avatar" style="width:34px;height:34px">${UI.esc(UI.initials(c.nombre))}</span><span>${UI.esc(c.nombre)}<small>${UI.esc(c.email)}</small></span></a>`).join('')}`;
            if (pedidos.length) html += `<div class="search-group">Pedidos</div>${pedidos.map((o) => {
                const c = customers.find((x) => x.id === o.clienteId);
                return `<a class="search-item" href="pedido-detalle.html?id=${o.id}"><span class="stat-icon tone-primary" style="width:34px;height:34px;font-size:1rem"><i class="bi bi-bag"></i></span><span>#${UI.esc(o.id)}<small>${UI.esc(c ? c.nombre : 'Cliente eliminado')} · ${UI.money(o.total)}</small></span></a>`;
            }).join('')}`;
            box.innerHTML = html || '<div class="p-3 text-center text-muted small">Sin resultados para esa búsqueda.</div>';
            box.classList.add('show');
        };
        input.addEventListener('input', UI.debounce(run, 200));
        input.addEventListener('focus', run);
        input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); input.blur(); } });
        document.addEventListener('click', (e) => { if (!wrap.contains(e.target) && e.target.id !== 'mobileSearchBtn') { close(); wrap.classList.remove('open'); } });
        document.getElementById('mobileSearchBtn').addEventListener('click', () => { wrap.classList.toggle('open'); input.focus(); });
    }

    /* ---------- Inicio ---------- */
    function mount() {
        const page = body.dataset.page;
        const user = DB.get('user');
        const settings = DB.get('settings');
        document.getElementById('sidebar-slot').outerHTML = buildSidebar(page, user, settings);
        document.getElementById('navbar-slot').outerHTML = buildNavbar(user);
        document.getElementById('footer-slot').outerHTML = buildFooter();

        setTheme(getTheme());
        Notifications.render();
        initSearch();

        document.getElementById('themeToggle').addEventListener('click', () => setTheme(getTheme() === 'dark' ? 'light' : 'dark'));
        document.getElementById('notifRead').addEventListener('click', () => Notifications.markAllRead());
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="logout"]')) {
                Auth.logout();
                location.replace('../login.html');
            }
        });
        // Cuando una imagen falla, se muestra la portada generada
        document.addEventListener('error', (e) => {
            const el = e.target;
            if (el.tagName === 'IMG' && el.dataset.fallback && el.src !== el.dataset.fallback) el.src = el.dataset.fallback;
        }, true);
    }

    if (!state.blocked) mount();

    return { ready, setTheme, getTheme, state };
})();
