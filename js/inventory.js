/* =========================================================
   inventory.js — Inventario y ajuste de stock
   ========================================================= */
const Inventory = (() => {
    const PER_PAGE = 10;
    const state = { q: '', estado: '', page: 1 };
    const MOTIVOS = ['Reabastecimiento', 'Corrección de inventario', 'Merma o daño', 'Devolución de cliente', 'Otro'];
    let modalEl, current = null;

    const all = () => DB.get('products');

    function stats() {
        const list = all();
        return {
            total: list.length,
            conStock: list.filter((p) => p.stock > 0).length,
            bajo: list.filter((p) => Products.status(p) === 'Stock bajo').length,
            agotados: list.filter((p) => p.stock === 0).length,
            valor: list.reduce((s, p) => s + p.precio * p.stock, 0)
        };
    }

    function renderStats() {
        const s = stats();
        const card = (label, value, icon, tone, foot) => `<div class="col-sm-6 col-xl-3"><article class="gs-card stat-card hover-lift"><div class="stat-top"><div><div class="stat-label">${label}</div>
            <div class="stat-value">${value}</div><small class="text-muted">${foot}</small></div><span class="stat-icon ${tone}"><i class="bi ${icon}"></i></span></div></article></div>`;
        document.getElementById('statsRow').innerHTML =
            card('Productos totales', s.total, 'bi-box-seam', 'tone-primary', `${s.conStock} con stock disponible`) +
            card('Stock bajo', s.bajo, 'bi-exclamation-triangle', 'tone-warning', 'Por debajo del mínimo') +
            card('Agotados', s.agotados, 'bi-x-octagon', 'tone-danger', 'Requieren reposición') +
            card('Valor del inventario', UI.money(s.valor), 'bi-currency-dollar', 'tone-success', 'Precio × stock');
    }

    function filtered() {
        const t = state.q.trim().toLowerCase();
        return all().filter((p) => (!t || p.nombre.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t)) && (!state.estado || Products.status(p) === state.estado))
            .sort((a, b) => a.stock - b.stock || a.nombre.localeCompare(b.nombre, 'es'));
    }

    function renderList() {
        renderStats();
        const stateEl = document.getElementById('listState');
        const wrap = document.getElementById('tableWrap');
        const pagerEl = document.getElementById('pager');
        const list = filtered();
        if (!list.length) {
            wrap.classList.add('d-none'); pagerEl.innerHTML = '';
            stateEl.innerHTML = UI.stateEmpty({ icon: 'bi-search', title: 'Sin resultados', text: 'Ningún producto coincide con los filtros.' });
            return;
        }
        stateEl.innerHTML = '';
        wrap.classList.remove('d-none');
        const pages = Math.ceil(list.length / PER_PAGE);
        if (state.page > pages) state.page = pages;
        document.getElementById('inventoryBody').innerHTML = list.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE).map((p) => {
            const st = Products.status(p);
            return `<tr><td><div class="cell-main">${UI.img(p, 'thumb-sm')}<div><a class="fw-semibold text-reset" href="producto-detalle.html?id=${p.id}">${UI.esc(p.nombre)}</a><small class="d-block">${UI.esc(p.plataforma)}</small></div></div></td>
                <td>${UI.esc(p.sku)}</td><td class="num fw-semibold ${p.stock <= p.stockMinimo ? 'text-warning' : ''}">${p.stock}</td><td class="num">${p.stockMinimo}</td>
                <td>${UI.badge(st, st === 'Stock bajo' ? 'Este producto tiene poco stock.' : '')}</td><td>${UI.date(p.actualizado)}</td>
                <td class="text-end"><button class="btn btn-sm btn-outline-primary" type="button" data-adjust="${p.id}"><i class="bi bi-sliders me-1"></i>Ajustar stock</button></td></tr>`;
        }).join('');
        UI.pager(pagerEl, { total: list.length, page: state.page, perPage: PER_PAGE, onChange: (p) => { state.page = p; renderList(); } });
    }

    function mountModal() {
        if (document.getElementById('stockModal')) return;
        const body = `<form id="stockForm" novalidate class="row g-3">
            ${UI.field('Producto', 'producto', { p: 'stk', col: 'col-12', readonly: true })}
            ${UI.field('Stock actual', 'actual', { p: 'stk', readonly: true })}
            ${UI.field('Nuevo stock', 'nuevo', { p: 'stk', required: true, type: 'number', attrs: 'min="0" step="1"' })}
            ${UI.field('Motivo', 'motivo', { p: 'stk', required: true, col: 'col-12', options: [['', 'Selecciona un motivo…'], ...MOTIVOS] })}</form>`;
        modalEl = UI.mountModal({
            id: 'stockModal', title: 'Ajustar stock', body, size: '',
            footer: '<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button><button type="submit" form="stockForm" class="btn btn-primary">Actualizar</button>'
        });
        const form = document.getElementById('stockForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const errors = {};
            const v = form.elements.nuevo.value;
            if (v === '' || isNaN(Number(v))) errors.nuevo = 'Ingresa un stock numérico.';
            else if (Number(v) < 0 || !Number.isInteger(Number(v))) errors.nuevo = 'El stock debe ser un entero no negativo.';
            if (!form.elements.motivo.value) errors.motivo = 'Selecciona el motivo del ajuste.';
            if (!UI.showErrors(form, errors)) return;

            const list = all();
            const p = list.find((x) => x.id === current);
            const before = p.stock;
            p.stock = Number(v);
            p.actualizado = UI.today();
            p.estado = Products.status(p);
            DB.set('products', list);
            UI.modal(modalEl).hide();
            Swal.fire({ ...UI.theme(), icon: 'success', title: 'Stock actualizado', text: `${p.nombre}: ${before} → ${p.stock} unidades (${form.elements.motivo.value}).`, confirmButtonColor: '#7c5cff', confirmButtonText: 'Aceptar' });
            if (p.stock === 0) Notifications.add(`${p.nombre} está agotado.`, 'stock');
            else if (p.stock <= p.stockMinimo) Notifications.add(`Producto con stock bajo: ${p.nombre} (${p.stock} unidades).`, 'stock');
            renderList();
        });
    }

    function openAdjust(id) {
        mountModal();
        const p = all().find((x) => x.id === Number(id));
        if (!p) return;
        current = p.id;
        const form = document.getElementById('stockForm');
        UI.clearErrors(form);
        form.reset();
        UI.setForm(form, { producto: p.nombre, actual: p.stock, nuevo: p.stock });
        UI.modal(modalEl).show();
        modalEl.addEventListener('shown.bs.modal', () => form.elements.nuevo.select(), { once: true });
    }

    function init() {
        const form = document.getElementById('filtersForm');
        const apply = () => { state.q = form.elements.q.value; state.estado = form.elements.estado.value; state.page = 1; renderList(); };
        form.addEventListener('submit', (e) => { e.preventDefault(); apply(); });
        form.elements.q.addEventListener('input', UI.debounce(apply, 250));
        form.elements.estado.addEventListener('change', apply);
        document.getElementById('btnClear').addEventListener('click', () => { form.reset(); apply(); });
        document.getElementById('inventoryBody').addEventListener('click', (e) => {
            const b = e.target.closest('[data-adjust]');
            if (b) openAdjust(b.dataset.adjust);
        });
        renderList();
    }
    return { init };
})();
