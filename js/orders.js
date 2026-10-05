/* =========================================================
   orders.js — Pedidos: listado, nuevo pedido, cambio de estado y detalle
   ========================================================= */
const Orders = (() => {
    const PER_PAGE = 8;
    const state = { q: '', estado: '', periodo: '', pago: '', page: 1 };
    const all = () => DB.get('orders');
    const find = (id) => all().find((o) => o.id === id);
    const customerOf = (o) => DB.get('customers').find((c) => c.id === o.clienteId);

    // "Steven Martínez" → "Steven M."
    const shortName = (c) => {
        if (!c) return 'Cliente eliminado';
        const [first, ...rest] = c.nombre.split(' ');
        return rest.length ? `${first} ${rest[0][0]}.` : first;
    };

    function totals(items) {
        const subtotal = items.reduce((s, i) => s + i.cantidad * i.precio, 0);
        const envio = subtotal === 0 || subtotal >= 5000 ? 0 : 250;
        const descuento = subtotal >= 8000 ? Math.round(subtotal * 0.05) : 0;
        return { subtotal, envio, descuento, total: subtotal + envio - descuento };
    }

    // Ajusta el stock al crear o cancelar pedidos (dir = -1 descuenta, +1 devuelve)
    function moveStock(items, dir) {
        const products = DB.get('products');
        items.forEach((it) => {
            const p = products.find((x) => x.id === it.productId);
            if (p) { p.stock = Math.max(0, p.stock + dir * it.cantidad); p.actualizado = UI.today(); p.estado = Products.status(p); }
        });
        DB.set('products', products);
    }

    function setStatus(id, estado) {
        const list = all();
        const o = list.find((x) => x.id === id);
        if (!o || o.estado === estado) return;
        if (estado === 'Cancelado') moveStock(o.items, +1);
        if (o.estado === 'Cancelado') moveStock(o.items, -1);
        o.estado = estado;
        DB.set('orders', list);
        if (estado === 'Completado') Notifications.add(`Pedido #${id} completado.`, 'pedido');
    }

    async function cancel(id) {
        const ok = await UI.confirm({ title: '¿Cancelar pedido?', text: `El pedido #${id} pasará a Cancelado y se devolverá el stock.`, confirmText: 'Sí, cancelar pedido' });
        if (ok) { setStatus(id, 'Cancelado'); UI.toast('Pedido cancelado.'); }
        return ok;
    }

    /* ---------- Nuevo pedido ---------- */
    let modalEl, onSaved = () => {};
    const lineHtml = (products) => `<div class="row g-2 mb-2 order-line">
        <div class="col-8"><label class="visually-hidden">Producto</label><select class="form-select line-product"><option value="">Selecciona un producto…</option>
        ${products.filter((p) => p.activo !== false && p.stock > 0).map((p) => `<option value="${p.id}">${UI.esc(p.nombre)} — ${UI.esc(p.plataforma)} (${UI.money(p.precio)} · stock ${p.stock})</option>`).join('')}</select></div>
        <div class="col-3"><label class="visually-hidden">Cantidad</label><input type="number" class="form-control line-qty" min="1" value="1" aria-label="Cantidad"></div>
        <div class="col-1"><button type="button" class="btn-icon danger line-remove" aria-label="Quitar línea"><i class="bi bi-x-lg"></i></button></div></div>`;

    function readLines() {
        const products = DB.get('products');
        return [...modalEl.querySelectorAll('.order-line')].map((row) => {
            const p = products.find((x) => x.id === Number(row.querySelector('.line-product').value));
            return p ? { p, cantidad: Number(row.querySelector('.line-qty').value) || 0 } : null;
        }).filter(Boolean);
    }
    function refreshSummary() {
        const lines = readLines().map((l) => ({ cantidad: l.cantidad, precio: l.p.precio }));
        const t = totals(lines);
        modalEl.querySelector('#orderSummary').innerHTML = `Subtotal ${UI.money(t.subtotal)} · Envío ${UI.money(t.envio)} · Descuento ${UI.money(t.descuento)} · <strong>Total ${UI.money(t.total)}</strong>`;
    }

    function mountModal() {
        if (document.getElementById('orderModal')) return;
        const customers = DB.get('customers').filter((c) => c.estado === 'Activo');
        const body = `<form id="orderForm" novalidate class="row g-3">
            ${UI.field('Cliente', 'clienteId', { p: 'ord', required: true, options: [['', 'Selecciona un cliente…'], ...customers.map((c) => [c.id, c.nombre])] })}
            ${UI.field('Método de pago', 'pago', { p: 'ord', required: true, options: SEED.METODOS_PAGO })}
            <div class="col-12"><label class="form-label">Productos <span class="text-danger">*</span></label><div id="orderLines"></div>
                <div class="text-danger small d-none" id="linesError"></div>
                <button type="button" class="btn btn-sm btn-outline-primary mt-1" id="addLine"><i class="bi bi-plus-lg me-1"></i>Agregar producto</button></div>
            <div class="col-12"><div class="gs-card gs-card-body py-2 small" id="orderSummary"></div></div></form>`;
        modalEl = UI.mountModal({
            id: 'orderModal', title: 'Nuevo pedido', body, size: 'modal-lg',
            footer: '<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button><button type="submit" form="orderForm" class="btn btn-primary">Crear pedido</button>'
        });
        const lines = modalEl.querySelector('#orderLines');
        modalEl.querySelector('#addLine').addEventListener('click', () => { lines.insertAdjacentHTML('beforeend', lineHtml(DB.get('products'))); });
        lines.addEventListener('input', refreshSummary);
        lines.addEventListener('click', (e) => {
            if (e.target.closest('.line-remove') && lines.children.length > 1) { e.target.closest('.order-line').remove(); refreshSummary(); }
        });
        const form = modalEl.querySelector('#orderForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const errors = {};
            if (!form.elements.clienteId.value) errors.clienteId = 'Selecciona un cliente.';
            UI.showErrors(form, errors);
            const err = modalEl.querySelector('#linesError');
            const picked = readLines();
            let msg = '';
            if (!picked.length) msg = 'Agrega al menos un producto.';
            else if (picked.some((l) => l.cantidad < 1 || !Number.isInteger(l.cantidad))) msg = 'Las cantidades deben ser enteros mayores que cero.';
            else {
                const bad = picked.find((l) => l.cantidad > l.p.stock);
                if (bad) msg = `Stock insuficiente de "${bad.p.nombre}" (disponible: ${bad.p.stock}).`;
            }
            err.textContent = msg;
            err.classList.toggle('d-none', !msg);
            if (msg || Object.keys(errors).length) return;

            const items = picked.map((l) => ({ productId: l.p.id, nombre: l.p.nombre, cantidad: l.cantidad, precio: l.p.precio }));
            const order = {
                id: DB.nextOrderId(), clienteId: Number(form.elements.clienteId.value), fecha: UI.today(), items,
                ...totals(items), pago: form.elements.pago.value, estado: 'Pendiente', nuevo: true
            };
            DB.set('orders', [...all(), order]);
            moveStock(items, -1);
            Notifications.add(`Nuevo pedido recibido: #${order.id}.`, 'pedido');
            DB.get('products').filter((p) => items.some((i) => i.productId === p.id) && p.stock <= (p.stockMinimo ?? 10))
                .forEach((p) => Notifications.add(`Producto con stock bajo: ${p.nombre} (${p.stock} unidades).`, 'stock'));
            UI.modal(modalEl).hide();
            UI.toast('Pedido creado correctamente.');
            onSaved(order);
        });
    }

    function openForm(cb) {
        mountModal();
        onSaved = cb || (() => {});
        const form = modalEl.querySelector('#orderForm');
        UI.clearErrors(form);
        form.reset();
        modalEl.querySelector('#linesError').classList.add('d-none');
        modalEl.querySelector('#orderLines').innerHTML = lineHtml(DB.get('products'));
        refreshSummary();
        UI.modal(modalEl).show();
    }

    /* ---------- Listado ---------- */
    function filtered() {
        const customers = DB.get('customers');
        const t = state.q.trim().toLowerCase();
        const limit = state.periodo ? new Date(Date.now() - Number(state.periodo) * 86400000).toISOString().slice(0, 10) : '';
        return all().filter((o) => {
            const c = customers.find((x) => x.id === o.clienteId);
            return (!t || o.id.toLowerCase().includes(t) || (c && c.nombre.toLowerCase().includes(t)) || o.items.some((i) => i.nombre.toLowerCase().includes(t)))
                && (!state.estado || o.estado === state.estado) && (!state.pago || o.pago === state.pago) && (!limit || o.fecha >= limit);
        }).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id));
    }

    function renderList() {
        const stateEl = document.getElementById('listState');
        const wrap = document.getElementById('tableWrap');
        const pagerEl = document.getElementById('pager');
        const list = filtered();
        if (!list.length) {
            wrap.classList.add('d-none'); pagerEl.innerHTML = '';
            stateEl.innerHTML = UI.stateEmpty({ icon: 'bi-bag', title: 'No se encontraron pedidos', text: 'Prueba con otros filtros o crea un nuevo pedido.' });
            return;
        }
        stateEl.innerHTML = '';
        wrap.classList.remove('d-none');
        const pages = Math.ceil(list.length / PER_PAGE);
        if (state.page > pages) state.page = pages;
        const customers = DB.get('customers');
        document.getElementById('ordersBody').innerHTML = list.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE).map((o) => {
            const c = customers.find((x) => x.id === o.clienteId);
            const n = o.items.reduce((s, i) => s + i.cantidad, 0);
            return `<tr><td><a href="pedido-detalle.html?id=${UI.esc(o.id)}" class="fw-semibold">#${UI.esc(o.id)}</a></td>
                <td>${c ? `<a class="text-reset" href="cliente-detalle.html?id=${c.id}">${UI.esc(c.nombre)}</a>` : 'Cliente eliminado'}</td><td>${UI.date(o.fecha)}</td>
                <td><span title="${UI.esc(o.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(', '))}">${n} ${n === 1 ? 'producto' : 'productos'}</span></td>
                <td class="num">${UI.money(o.total)}</td><td>${UI.esc(o.pago)}</td><td>${UI.badge(o.estado)}</td>
                <td><div class="actions"><a class="btn-icon primary" href="pedido-detalle.html?id=${UI.esc(o.id)}" aria-label="Ver pedido ${UI.esc(o.id)}"><i class="bi bi-eye"></i></a>
                ${['Pendiente', 'Procesando', 'Enviado'].includes(o.estado) ? `<button class="btn-icon danger" type="button" data-cancel="${UI.esc(o.id)}" aria-label="Cancelar pedido ${UI.esc(o.id)}"><i class="bi bi-x-circle"></i></button>` : ''}</div></td></tr>`;
        }).join('');
        UI.pager(pagerEl, { total: list.length, page: state.page, perPage: PER_PAGE, onChange: (p) => { state.page = p; renderList(); } });
    }

    function initList() {
        const form = document.getElementById('filtersForm');
        const apply = () => {
            const f = form.elements;
            Object.assign(state, { q: f.q.value, estado: f.estado.value, periodo: f.periodo.value, pago: f.pago.value, page: 1 });
            renderList();
        };
        form.addEventListener('submit', (e) => { e.preventDefault(); apply(); });
        form.elements.q.addEventListener('input', UI.debounce(apply, 250));
        ['estado', 'periodo', 'pago'].forEach((n) => form.elements[n].addEventListener('change', apply));
        document.getElementById('btnClear').addEventListener('click', () => { form.reset(); apply(); });
        document.getElementById('btnAdd').addEventListener('click', () => openForm(renderList));
        document.getElementById('ordersBody').addEventListener('click', async (e) => {
            const b = e.target.closest('[data-cancel]');
            if (b && await cancel(b.dataset.cancel)) renderList();
        });
        renderList();
    }

    /* ---------- Detalle ---------- */
    function initDetail() {
        const root = document.getElementById('detailRoot');
        const id = new URLSearchParams(location.search).get('id');
        const render = () => {
            const o = find(id);
            if (!o) {
                root.innerHTML = UI.stateEmpty({ icon: 'bi-bag-x', title: 'Pedido no encontrado', text: 'El pedido no existe.', button: '<a class="btn btn-primary" href="pedidos.html">Volver a pedidos</a>' });
                return;
            }
            const c = customerOf(o);
            const canCancel = ['Pendiente', 'Procesando', 'Enviado'].includes(o.estado);
            root.innerHTML = `<div class="d-flex flex-wrap gap-2 mb-3 no-print">
                    <a class="btn btn-outline-secondary" href="pedidos.html"><i class="bi bi-arrow-left me-1"></i>Volver</a>
                    <button class="btn btn-primary" type="button" id="oPrint"><i class="bi bi-printer me-1"></i>Imprimir pedido</button>
                    ${canCancel ? '<button class="btn btn-outline-danger" type="button" id="oCancel"><i class="bi bi-x-circle me-1"></i>Cancelar pedido</button>' : ''}</div>
                <div class="row g-3">
                <div class="col-lg-4"><article class="gs-card h-100"><div class="gs-card-header"><h2>Pedido</h2></div><div class="gs-card-body">
                    <p class="h3 mb-3">#${UI.esc(o.id)}</p>
                    <dl class="detail-list" style="grid-template-columns:1fr">
                        <div><dt>Fecha</dt><dd>${UI.date(o.fecha)}</dd></div><div><dt>Método de pago</dt><dd>${UI.esc(o.pago)}</dd></div>
                        <div><dt>Estado</dt><dd>${UI.badge(o.estado)}</dd></div></dl>
                    <div class="mt-3 no-print"><label class="form-label" for="oStatus">Cambiar estado</label>
                        <select class="form-select" id="oStatus">${SEED.ESTADOS_PEDIDO.map((s) => `<option ${s === o.estado ? 'selected' : ''}>${s}</option>`).join('')}</select></div></div></article></div>
                <div class="col-lg-8"><article class="gs-card h-100"><div class="gs-card-header"><h2>Cliente</h2>${c ? `<a class="btn btn-sm btn-outline-secondary no-print" href="cliente-detalle.html?id=${c.id}">Ver cliente</a>` : ''}</div><div class="gs-card-body">
                    ${c ? `<dl class="detail-list"><div><dt>Nombre</dt><dd>${UI.esc(c.nombre)}</dd></div><div><dt>Email</dt><dd>${UI.esc(c.email)}</dd></div>
                    <div><dt>Teléfono</dt><dd>${UI.esc(c.telefono)}</dd></div><div><dt>Dirección</dt><dd>${UI.esc(c.direccion)}</dd></div></dl>` : '<p class="text-muted mb-0">El cliente de este pedido fue eliminado.</p>'}</div></article></div>
                <div class="col-lg-8"><article class="gs-card"><div class="gs-card-header"><h2>Productos</h2></div><div class="table-responsive">
                    <table class="table gs-table align-middle mb-0"><thead><tr><th>Producto</th><th class="num">Cantidad</th><th class="num">Precio</th><th class="num">Subtotal</th></tr></thead><tbody>
                    ${o.items.map((i) => `<tr><td><strong>${UI.esc(i.nombre)}</strong></td><td class="num">${i.cantidad}</td><td class="num">${UI.money(i.precio)}</td><td class="num">${UI.money(i.cantidad * i.precio)}</td></tr>`).join('')}</tbody></table></div></article></div>
                <div class="col-lg-4"><article class="gs-card"><div class="gs-card-header"><h2>Resumen</h2></div><div class="gs-card-body">
                    <div class="summary-row"><span>Subtotal</span><span>${UI.money(o.subtotal)}</span></div>
                    <div class="summary-row"><span>Envío</span><span>${o.envio ? UI.money(o.envio) : 'Gratis'}</span></div>
                    <div class="summary-row"><span>Descuento</span><span>${o.descuento ? '− ' + UI.money(o.descuento) : UI.money(0)}</span></div>
                    <div class="summary-row total"><span>Total</span><span>${UI.money(o.total)}</span></div></div></article></div></div>`;
            document.getElementById('oPrint').addEventListener('click', () => window.print());
            document.getElementById('oStatus').addEventListener('change', (e) => { setStatus(o.id, e.target.value); UI.toast('Estado del pedido actualizado.'); render(); });
            const cb = document.getElementById('oCancel');
            if (cb) cb.addEventListener('click', async () => { if (await cancel(o.id)) render(); });
        };
        render();
    }

    return { shortName, find, all, initList, initDetail };
})();
