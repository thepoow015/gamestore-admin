/* =========================================================
   dashboard.js — Página principal
   ========================================================= */
const Dashboard = (() => {
    let salesChart = null;
    let categoryChart = null;
    const demo = SEED.demo;

    // Indicadores: parten de las cifras demo y suman lo registrado desde la app
    function kpis(period) {
        const products = DB.get('products');
        const orders = DB.get('orders');
        const nuevos = orders.filter((o) => o.nuevo && o.estado !== 'Cancelado');
        const extraVentas = nuevos.reduce((s, o) => s + o.total, 0);
        const p = demo.kpiPeriodos[period];
        return {
            ventas: p.ventas + extraVentas, ventasDelta: p.delta, comparacion: p.comparacion,
            pedidos: demo.pedidosBase + orders.filter((o) => o.nuevo).length,
            clientes: demo.clientesBase + DB.get('customers').filter((c) => c.nuevo).length,
            productos: products.length, bajo: products.filter((x) => Products.status(x) === 'Stock bajo' || Products.status(x) === 'Agotado').length
        };
    }

    function renderKpis() {
        const k = kpis(document.getElementById('periodSelect').value);
        const card = (label, value, icon, tone, foot) => `<div class="col-sm-6 col-xl-3"><article class="gs-card stat-card hover-lift">
            <div class="stat-top"><div><div class="stat-label">${label}</div><div class="stat-value">${value}</div></div><span class="stat-icon ${tone}"><i class="bi ${icon}" aria-hidden="true"></i></span></div>${foot}</article></div>`;
        const up = (v, txt) => `<small><span class="trend-up"><i class="bi bi-arrow-up-right"></i> +${v}%</span> <span class="text-muted">${txt}</span></small>`;
        document.getElementById('kpiRow').innerHTML =
            card('Ventas', UI.money(k.ventas), 'bi-cash-coin', 'tone-primary', up(k.ventasDelta, k.comparacion)) +
            card('Pedidos', UI.num(k.pedidos), 'bi-bag-check', 'tone-secondary', up(8.2, 'vs. mes anterior')) +
            card('Clientes', UI.num(k.clientes), 'bi-people', 'tone-success', up(5.4, 'vs. mes anterior')) +
            card('Productos', UI.num(k.productos), 'bi-controller', 'tone-warning',
                `<small class="${k.bajo ? 'text-warning' : 'text-muted'}"><i class="bi bi-exclamation-triangle"></i> ${k.bajo} con stock bajo</small>`);
    }

    function renderSales() {
        const key = document.getElementById('salesRange').value;
        const s = demo.series[key];
        document.getElementById('salesSubtitle').textContent = s.titulo + ' · datos de demostración';
        const t = UI.chartTheme();
        if (salesChart) salesChart.destroy();
        salesChart = new Chart(document.getElementById('salesChart'), {
            type: key === '7d' || key === '30d' ? 'bar' : 'line',
            data: {
                labels: s.labels,
                datasets: [{
                    label: 'Ventas (RD$)', data: s.data, borderColor: '#7c5cff', backgroundColor: key === '7d' || key === '30d' ? '#7c5cff' : 'rgba(124,92,255,.18)',
                    fill: true, tension: .38, borderWidth: 3, pointRadius: 4, pointBackgroundColor: '#22d3ee', borderRadius: 8
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ' ' + UI.money(c.parsed.y) } } },
                scales: {
                    x: { ticks: { color: t.text }, grid: { display: false } },
                    y: { beginAtZero: true, ticks: { color: t.text, callback: (v) => 'RD$ ' + (v / 1000) + 'k' }, grid: { color: t.grid } }
                }
            }
        });
    }

    // Ingresos por categoría = unidades vendidas × precio de cada producto
    function renderCategories() {
        const totals = {};
        DB.get('products').forEach((p) => { totals[p.categoria] = (totals[p.categoria] || 0) + (p.vendidos || 0) * p.precio; });
        const entries = Object.entries(totals).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
        const t = UI.chartTheme();
        if (categoryChart) categoryChart.destroy();
        categoryChart = new Chart(document.getElementById('categoryChart'), {
            type: 'doughnut',
            data: { labels: entries.map((e) => e[0]), datasets: [{ data: entries.map((e) => e[1]), backgroundColor: UI.CHART_COLORS, borderColor: t.surface, borderWidth: 3 }] },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '62%',
                plugins: { legend: { position: 'bottom', labels: { color: t.text, boxWidth: 10, usePointStyle: true } }, tooltip: { callbacks: { label: (c) => ` ${c.label}: ${UI.money(c.parsed)}` } } }
            }
        });
    }

    function renderOrders() {
        const customers = DB.get('customers');
        const rows = DB.get('orders').slice().sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id)).slice(0, 6);
        document.getElementById('recentOrders').innerHTML = rows.map((o) => {
            const c = customers.find((x) => x.id === o.clienteId);
            return `<tr><td><a href="pedido-detalle.html?id=${UI.esc(o.id)}" class="fw-semibold">#${UI.esc(o.id)}</a></td><td>${UI.esc(Orders.shortName(c))}</td>
                <td>${UI.date(o.fecha)}</td><td class="num">${UI.money(o.total)}</td><td>${UI.esc(o.pago)}</td><td>${UI.badge(o.estado)}</td>
                <td class="text-end"><a class="btn-icon primary" href="pedido-detalle.html?id=${UI.esc(o.id)}" aria-label="Ver pedido ${UI.esc(o.id)}"><i class="bi bi-eye"></i></a></td></tr>`;
        }).join('');
    }

    function renderTop() {
        const top = DB.get('products').slice().sort((a, b) => b.vendidos - a.vendidos).slice(0, 5);
        document.getElementById('topProducts').innerHTML = top.map((p, i) => `<div class="top-item"><span class="rank">${i + 1}</span>${UI.img(p, 'thumb-sm')}
            <div class="meta"><strong>${UI.esc(p.nombre)}</strong><small>${UI.num(p.vendidos)} ventas</small></div><strong>${UI.money(p.vendidos * p.precio)}</strong></div>`).join('');
    }

    function renderAlerts() {
        const low = DB.get('products').filter((p) => ['Stock bajo', 'Agotado'].includes(Products.status(p))).sort((a, b) => a.stock - b.stock).slice(0, 5);
        document.getElementById('stockAlerts').innerHTML = low.length ? low.map((p) => `<div class="alert-item"><span class="stat-icon ${p.stock === 0 ? 'tone-danger' : 'tone-warning'}" style="width:38px;height:38px;font-size:1.05rem"><i class="bi bi-box-seam"></i></span>
            <div class="meta"><strong>${UI.esc(p.nombre)}</strong><small>${p.stock === 0 ? 'Agotado' : p.stock + (p.stock === 1 ? ' unidad restante' : ' unidades restantes')}</small></div>
            <a class="btn-icon primary" href="producto-detalle.html?id=${p.id}" aria-label="Ver ${UI.esc(p.nombre)}"><i class="bi bi-arrow-right"></i></a></div>`).join('')
            : UI.stateEmpty({ icon: 'bi-check-circle', title: 'Todo en orden', text: 'No hay productos con stock bajo.' });
    }

    function exportCSV() {
        const customers = DB.get('customers');
        const rows = [['ID', 'Cliente', 'Fecha', 'Total', 'Pago', 'Estado']].concat(DB.get('orders').map((o) => {
            const c = customers.find((x) => x.id === o.clienteId);
            return [o.id, c ? c.nombre : '', o.fecha, o.total, o.pago, o.estado];
        }));
        UI.downloadCSV('gamestore-pedidos.csv', rows);
        UI.toast('Pedidos exportados a CSV.');
    }

    function init() {
        const d = new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        document.getElementById('todayLabel').textContent = d.charAt(0).toUpperCase() + d.slice(1);
        document.getElementById('periodSelect').addEventListener('change', renderKpis);
        document.getElementById('salesRange').addEventListener('change', renderSales);
        document.getElementById('btnExport').addEventListener('click', exportCSV);
        document.addEventListener('gs:theme', () => { renderSales(); renderCategories(); });
        renderKpis(); renderSales(); renderCategories(); renderOrders(); renderTop(); renderAlerts();
    }

    return { init };
})();
GS.ready(Dashboard.init);
