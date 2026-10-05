/* =========================================================
   reports.js — Reportes con Chart.js (datos reales + serie demo)
   ========================================================= */
const Reports = (() => {
    const charts = {};
    const demo = SEED.demo;

    function makeChart(id, config) {
        if (charts[id]) charts[id].destroy();
        charts[id] = new Chart(document.getElementById(id), config);
    }

    const kpi = (label, value, icon, tone, foot = '') => `<div class="col-sm-6 col-xl-3"><article class="gs-card stat-card hover-lift"><div class="stat-top"><div><div class="stat-label">${label}</div>
        <div class="stat-value">${value}</div><small class="text-muted">${foot}</small></div><span class="stat-icon ${tone}"><i class="bi ${icon}"></i></span></div></article></div>`;

    function renderSales() {
        const m = demo.mensual;
        const total = m.ventas.reduce((a, b) => a + b, 0);
        const pedidos = m.pedidos.reduce((a, b) => a + b, 0);
        const last = m.ventas[m.ventas.length - 1], prev = m.ventas[m.ventas.length - 2];
        const growth = ((last - prev) / prev) * 100;
        document.getElementById('salesKpis').innerHTML =
            kpi('Ventas totales', UI.money(total), 'bi-cash-coin', 'tone-primary', 'Enero – Julio') +
            kpi('Promedio por pedido', UI.money(total / pedidos), 'bi-receipt', 'tone-secondary', 'Ticket promedio') +
            kpi('Número de pedidos', UI.num(pedidos), 'bi-bag-check', 'tone-success', 'Acumulado del periodo') +
            kpi('Crecimiento', `<span class="trend-up">+${growth.toFixed(1)}%</span>`, 'bi-graph-up-arrow', 'tone-warning', 'Julio vs. junio');
        const t = UI.chartTheme();
        makeChart('salesChart', {
            type: 'bar',
            data: { labels: m.meses, datasets: [{ label: 'Ventas (RD$)', data: m.ventas, backgroundColor: '#7c5cff', borderRadius: 8 },
                { type: 'line', label: 'Pedidos', data: m.pedidos, yAxisID: 'y1', borderColor: '#22d3ee', backgroundColor: '#22d3ee', tension: .35, borderWidth: 3 }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { labels: { color: t.text, usePointStyle: true } }, tooltip: { callbacks: { label: (c) => c.dataset.yAxisID === 'y1' ? ` ${c.parsed.y} pedidos` : ' ' + UI.money(c.parsed.y) } } },
                scales: { x: { ticks: { color: t.text }, grid: { display: false } }, y: { ticks: { color: t.text, callback: (v) => (v / 1000) + 'k' }, grid: { color: t.grid } },
                    y1: { position: 'right', ticks: { color: t.text }, grid: { display: false } } }
            }
        });
        document.getElementById('monthlyBody').innerHTML = m.meses.map((mes, i) => {
            const g = i ? ((m.ventas[i] - m.ventas[i - 1]) / m.ventas[i - 1]) * 100 : null;
            return `<tr><td>${mes}</td><td class="num">${UI.money(m.ventas[i])}</td><td class="num">${m.pedidos[i]}</td><td class="num">${UI.money(m.ventas[i] / m.pedidos[i])}</td>
                <td class="num">${g === null ? '—' : `<span class="${g >= 0 ? 'trend-up' : 'trend-down'}">${g >= 0 ? '+' : ''}${g.toFixed(1)}%</span>`}</td></tr>`;
        }).join('');
    }

    function productRow(p, extra) {
        return `<div class="top-item">${UI.img(p, 'thumb-sm')}<div class="meta"><strong>${UI.esc(p.nombre)}</strong><small>${UI.esc(p.plataforma)}</small></div><span class="text-end small">${extra}</span></div>`;
    }

    function renderProducts() {
        const list = DB.get('products');
        const sold = list.slice().sort((a, b) => b.vendidos - a.vendidos);
        const empty = (t) => `<p class="text-muted text-center py-4 mb-0">${t}</p>`;
        document.getElementById('topSold').innerHTML = sold.slice(0, 5).map((p) => productRow(p, `<strong>${UI.num(p.vendidos)}</strong> ventas`)).join('');
        document.getElementById('lowSold').innerHTML = sold.slice(-5).reverse().map((p) => productRow(p, `<strong>${UI.num(p.vendidos)}</strong> ventas`)).join('');
        const low = list.filter((p) => Products.status(p) === 'Stock bajo');
        const out = list.filter((p) => p.stock === 0);
        document.getElementById('lowStock').innerHTML = low.length ? low.map((p) => productRow(p, `<span class="text-warning fw-semibold">${p.stock} uds.</span>`)).join('') : empty('Sin productos con stock bajo.');
        document.getElementById('outStock').innerHTML = out.length ? out.map((p) => productRow(p, UI.badge('Agotado'))).join('') : empty('No hay productos agotados.');
    }

    function renderOrders() {
        const orders = DB.get('orders');
        const t = UI.chartTheme();
        const byEstado = SEED.ESTADOS_PEDIDO.map((e) => orders.filter((o) => o.estado === e).length);
        makeChart('ordersChart', {
            type: 'doughnut',
            data: { labels: SEED.ESTADOS_PEDIDO, datasets: [{ data: byEstado, backgroundColor: ['#22c55e', '#38bdf8', '#f59e0b', '#7c5cff', '#ef4444'], borderColor: t.surface, borderWidth: 3 }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: t.text, usePointStyle: true } } } }
        });
        const valid = orders.filter((o) => o.estado !== 'Cancelado');
        makeChart('paymentChart', {
            type: 'bar',
            data: { labels: SEED.METODOS_PAGO, datasets: [{ label: 'Ingresos (RD$)', data: SEED.METODOS_PAGO.map((m) => valid.filter((o) => o.pago === m).reduce((s, o) => s + o.total, 0)), backgroundColor: ['#7c5cff', '#22d3ee', '#38bdf8', '#22c55e'], borderRadius: 8 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ' ' + UI.money(c.parsed.y) } } },
                scales: { x: { ticks: { color: t.text }, grid: { display: false } }, y: { beginAtZero: true, ticks: { color: t.text }, grid: { color: t.grid } } } }
        });
        const sum = (arr) => arr.reduce((s, o) => s + o.total, 0);
        document.getElementById('ordersKpis').innerHTML =
            kpi('Pedidos registrados', orders.length, 'bi-bag', 'tone-primary', 'En el sistema') +
            kpi('Ingresos confirmados', UI.money(sum(valid)), 'bi-cash-stack', 'tone-success', 'Sin cancelados') +
            kpi('Pendientes / procesando', orders.filter((o) => ['Pendiente', 'Procesando'].includes(o.estado)).length, 'bi-hourglass-split', 'tone-warning', 'Por atender') +
            kpi('Cancelados', orders.filter((o) => o.estado === 'Cancelado').length, 'bi-x-circle', 'tone-danger', 'Stock devuelto');
    }

    function renderCustomers() {
        const orders = DB.get('orders').filter((o) => o.estado !== 'Cancelado');
        const rows = DB.get('customers').map((c) => {
            const os = orders.filter((o) => o.clienteId === c.id);
            return { c, n: os.length, total: os.reduce((s, o) => s + o.total, 0) };
        }).sort((a, b) => b.total - a.total).slice(0, 5);
        document.getElementById('topCustomers').innerHTML = rows.map((r, i) => `<div class="top-item"><span class="rank">${i + 1}</span><span class="avatar" style="width:38px;height:38px">${UI.esc(UI.initials(r.c.nombre))}</span>
            <div class="meta"><strong>${UI.esc(r.c.nombre)}</strong><small>${r.n} pedidos</small></div><strong>${UI.money(r.total)}</strong></div>`).join('');
    }

    function renderInventory() {
        const products = DB.get('products');
        const t = UI.chartTheme();
        const cats = [...new Set(products.map((p) => p.categoria))];
        makeChart('inventoryChart', {
            type: 'bar',
            data: { labels: cats, datasets: [{ label: 'Valor en inventario (RD$)', data: cats.map((c) => products.filter((p) => p.categoria === c).reduce((s, p) => s + p.precio * p.stock, 0)), backgroundColor: '#22d3ee', borderRadius: 8 }] },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ' ' + UI.money(c.parsed.x) } } },
                scales: { x: { ticks: { color: t.text }, grid: { color: t.grid } }, y: { ticks: { color: t.text }, grid: { display: false } } } }
        });
        const value = products.reduce((s, p) => s + p.precio * p.stock, 0);
        document.getElementById('inventoryKpis').innerHTML =
            kpi('Valor del inventario', UI.money(value), 'bi-currency-dollar', 'tone-success', 'Precio × stock') +
            kpi('Unidades en stock', UI.num(products.reduce((s, p) => s + p.stock, 0)), 'bi-boxes', 'tone-primary', `${products.length} productos`) +
            kpi('Stock bajo', products.filter((p) => Products.status(p) === 'Stock bajo').length, 'bi-exclamation-triangle', 'tone-warning', 'Por reponer') +
            kpi('Agotados', products.filter((p) => p.stock === 0).length, 'bi-x-octagon', 'tone-danger', 'Sin existencias');
    }

    function exportCSV(kind) {
        if (kind === 'ventas') {
            const m = demo.mensual;
            UI.downloadCSV('gamestore-ventas-mensuales.csv', [['Mes', 'Ventas (RD$)', 'Pedidos', 'Ticket promedio']].concat(m.meses.map((mes, i) => [mes, m.ventas[i], m.pedidos[i], Math.round(m.ventas[i] / m.pedidos[i])])));
        } else if (kind === 'productos') {
            UI.downloadCSV('gamestore-productos.csv', [['SKU', 'Producto', 'Categoría', 'Plataforma', 'Precio', 'Stock', 'Estado', 'Vendidos']].concat(DB.get('products').map((p) => [p.sku, p.nombre, p.categoria, p.plataforma, p.precio, p.stock, Products.status(p), p.vendidos])));
        } else {
            const orders = DB.get('orders').filter((o) => o.estado !== 'Cancelado');
            UI.downloadCSV('gamestore-clientes.csv', [['ID', 'Nombre', 'Email', 'Estado', 'Pedidos', 'Total gastado']].concat(DB.get('customers').map((c) => {
                const os = orders.filter((o) => o.clienteId === c.id);
                return [c.id, c.nombre, c.email, c.estado, os.length, os.reduce((s, o) => s + o.total, 0)];
            })));
        }
        UI.toast('Reporte exportado a CSV.');
    }

    function renderAll() { renderSales(); renderOrders(); renderInventory(); }

    function init() {
        renderAll(); renderProducts(); renderCustomers();
        document.addEventListener('gs:theme', renderAll);
        document.getElementById('exportMenu').addEventListener('click', (e) => {
            const b = e.target.closest('[data-export]');
            if (b) exportCSV(b.dataset.export);
        });
    }
    return { init };
})();
