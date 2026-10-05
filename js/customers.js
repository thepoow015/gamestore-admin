/* =========================================================
   customers.js — Clientes: listado, CRUD y detalle
   ========================================================= */
const Customers = (() => {
    const PER_PAGE = 8;
    const ESTADOS = ['Activo', 'Inactivo', 'Bloqueado'];
    const state = { q: '', estado: '', page: 1 };
    let modalEl, editingId = null, onSaved = () => {};

    const all = () => DB.get('customers');
    const find = (id) => all().find((c) => c.id === Number(id));
    const ordersOf = (id) => DB.get('orders').filter((o) => o.clienteId === id);
    // Total gastado: pedidos no cancelados
    const spent = (id) => ordersOf(id).filter((o) => o.estado !== 'Cancelado').reduce((s, o) => s + o.total, 0);

    /* ---------- Formulario ---------- */
    function mountModal() {
        if (document.getElementById('customerModal')) return;
        const f = (l, n, o) => UI.field(l, n, { p: 'cus', ...o });
        const body = `<form id="customerForm" novalidate class="row g-3">
            ${f('Nombre completo', 'nombre', { required: true, col: 'col-12' })}
            ${f('Email', 'email', { required: true, type: 'email', placeholder: 'nombre@example.com' })}
            ${f('Teléfono', 'telefono', { required: true, placeholder: '+1 (809) 555-0000' })}
            ${f('Dirección', 'direccion', { required: true, col: 'col-12' })}
            ${f('Estado', 'estado', { options: ESTADOS })}
        </form>`;
        modalEl = UI.mountModal({
            id: 'customerModal', title: 'Cliente', body, size: '',
            footer: '<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button><button type="submit" form="customerForm" class="btn btn-primary">Guardar cliente</button>'
        });
        const form = document.getElementById('customerForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const d = UI.readForm(form);
            const errors = {};
            if (!d.nombre.trim()) errors.nombre = 'El nombre es obligatorio.';
            if (!d.email.trim()) errors.email = 'El email es obligatorio.';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) errors.email = 'Ingresa un email válido.';
            else if (all().some((c) => c.email.toLowerCase() === d.email.trim().toLowerCase() && c.id !== editingId)) errors.email = 'Ya existe un cliente con ese email.';
            if (!d.telefono.trim()) errors.telefono = 'El teléfono es obligatorio.';
            else if (d.telefono.replace(/\D/g, '').length < 7) errors.telefono = 'Ingresa un teléfono válido.';
            if (!d.direccion.trim()) errors.direccion = 'La dirección es obligatoria.';
            if (!UI.showErrors(form, errors)) return;

            const list = all();
            const data = { nombre: d.nombre.trim(), email: d.email.trim(), telefono: d.telefono.trim(), direccion: d.direccion.trim(), estado: d.estado };
            let saved;
            if (editingId) {
                const i = list.findIndex((c) => c.id === editingId);
                saved = { ...list[i], ...data };
                list[i] = saved;
            } else {
                saved = { id: DB.nextId(list), registro: UI.today(), nuevo: true, ...data };
                list.push(saved);
                Notifications.add(`Nuevo cliente registrado: ${saved.nombre}.`, 'cliente');
            }
            DB.set('customers', list);
            UI.modal(modalEl).hide();
            UI.toast(editingId ? 'Cliente actualizado.' : 'Cliente guardado correctamente.');
            onSaved(saved);
        });
    }

    function openForm(id, cb) {
        mountModal();
        onSaved = cb || (() => {});
        editingId = id ? Number(id) : null;
        const form = document.getElementById('customerForm');
        UI.clearErrors(form);
        form.reset();
        const c = editingId ? find(editingId) : null;
        document.getElementById('customerModalLabel').textContent = c ? 'Editar cliente' : 'Nuevo cliente';
        if (c) UI.setForm(form, c);
        UI.modal(modalEl).show();
        modalEl.addEventListener('shown.bs.modal', () => form.elements.nombre.focus(), { once: true });
    }

    async function remove(id) {
        const c = find(id);
        if (!c) return false;
        if (ordersOf(c.id).length) {
            UI.error('No se puede eliminar', `${c.nombre} tiene pedidos registrados. Cambia su estado a Inactivo en lugar de eliminarlo.`);
            return false;
        }
        const ok = await UI.confirm({ title: '¿Eliminar cliente?', text: 'Esta acción no se puede deshacer.' });
        if (ok) { DB.set('customers', all().filter((x) => x.id !== c.id)); UI.toast('Cliente eliminado correctamente.'); }
        return ok;
    }

    /* ---------- Listado ---------- */
    function filtered() {
        const t = state.q.trim().toLowerCase();
        return all().filter((c) => (!t || [c.nombre, c.email, c.telefono].some((v) => v.toLowerCase().includes(t))) && (!state.estado || c.estado === state.estado));
    }

    function renderList() {
        const stateEl = document.getElementById('listState');
        const wrap = document.getElementById('tableWrap');
        const pagerEl = document.getElementById('pager');
        const list = filtered();
        if (!list.length) {
            wrap.classList.add('d-none'); pagerEl.innerHTML = '';
            stateEl.innerHTML = all().length
                ? UI.stateEmpty({ icon: 'bi-search', title: 'Sin resultados', text: 'Ningún cliente coincide con los filtros.' })
                : UI.stateEmpty({ icon: 'bi-people', title: 'No hay clientes registrados.', button: '<button class="btn btn-primary" type="button" data-add>Nuevo cliente</button>' });
            return;
        }
        stateEl.innerHTML = '';
        wrap.classList.remove('d-none');
        const pages = Math.ceil(list.length / PER_PAGE);
        if (state.page > pages) state.page = pages;
        const slice = list.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE);
        document.getElementById('customersBody').innerHTML = slice.map((c) => `<tr>
            <td class="text-muted">#${c.id}</td>
            <td><div class="cell-main"><span class="avatar" aria-hidden="true">${UI.esc(UI.initials(c.nombre))}</span><div><a class="fw-semibold text-reset" href="cliente-detalle.html?id=${c.id}">${UI.esc(c.nombre)}</a></div></div></td>
            <td>${UI.esc(c.email)}</td><td>${UI.esc(c.telefono)}</td><td>${UI.date(c.registro)}</td>
            <td class="num">${ordersOf(c.id).length}</td><td class="num">${UI.money(spent(c.id))}</td><td>${UI.badge(c.estado)}</td>
            <td><div class="actions"><a class="btn-icon primary" href="cliente-detalle.html?id=${c.id}" aria-label="Ver ${UI.esc(c.nombre)}"><i class="bi bi-eye"></i></a>
            <button class="btn-icon" type="button" data-action="edit" data-id="${c.id}" aria-label="Editar ${UI.esc(c.nombre)}"><i class="bi bi-pencil"></i></button>
            <button class="btn-icon danger" type="button" data-action="delete" data-id="${c.id}" aria-label="Eliminar ${UI.esc(c.nombre)}"><i class="bi bi-trash"></i></button></div></td></tr>`).join('');
        UI.pager(pagerEl, { total: list.length, page: state.page, perPage: PER_PAGE, onChange: (p) => { state.page = p; renderList(); } });
    }

    function initList() {
        const form = document.getElementById('filtersForm');
        const apply = () => { state.q = form.elements.q.value; state.estado = form.elements.estado.value; state.page = 1; renderList(); };
        form.addEventListener('submit', (e) => { e.preventDefault(); apply(); });
        form.elements.q.addEventListener('input', UI.debounce(apply, 250));
        form.elements.estado.addEventListener('change', apply);
        document.getElementById('btnClear').addEventListener('click', () => { form.reset(); apply(); });
        document.getElementById('btnAdd').addEventListener('click', () => openForm(null, renderList));
        document.getElementById('listState').addEventListener('click', (e) => { if (e.target.closest('[data-add]')) openForm(null, renderList); });
        document.getElementById('customersBody').addEventListener('click', async (e) => {
            const b = e.target.closest('[data-action]');
            if (!b) return;
            if (b.dataset.action === 'edit') openForm(b.dataset.id, renderList);
            else if (await remove(b.dataset.id)) renderList();
        });
        renderList();
    }

    /* ---------- Detalle ---------- */
    function initDetail() {
        const root = document.getElementById('detailRoot');
        const id = new URLSearchParams(location.search).get('id');
        const render = () => {
            const c = find(id);
            if (!c) {
                root.innerHTML = UI.stateEmpty({ icon: 'bi-person-x', title: 'Cliente no encontrado', text: 'El cliente no existe o fue eliminado.', button: '<a class="btn btn-primary" href="clientes.html">Volver a clientes</a>' });
                return;
            }
            const orders = ordersOf(c.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
            root.innerHTML = `<div class="row g-3">
                <div class="col-lg-4"><article class="gs-card h-100"><div class="gs-card-body text-center">
                    <span class="avatar avatar-lg mb-3" aria-hidden="true">${UI.esc(UI.initials(c.nombre))}</span>
                    <h2 class="h4 mb-1">${UI.esc(c.nombre)}</h2><div class="mb-3">${UI.badge(c.estado)}</div>
                    <div class="d-flex justify-content-center gap-2 no-print"><button class="btn btn-primary btn-sm" type="button" id="cEdit"><i class="bi bi-pencil me-1"></i>Editar</button>
                    <a class="btn btn-outline-secondary btn-sm" href="clientes.html"><i class="bi bi-arrow-left me-1"></i>Volver</a></div></div></article></div>
                <div class="col-lg-8"><article class="gs-card h-100"><div class="gs-card-header"><h2>Información del cliente</h2></div><div class="gs-card-body">
                    <dl class="detail-list">
                        <div><dt>Email</dt><dd>${UI.esc(c.email)}</dd></div><div><dt>Teléfono</dt><dd>${UI.esc(c.telefono)}</dd></div>
                        <div><dt>Dirección</dt><dd>${UI.esc(c.direccion)}</dd></div><div><dt>Fecha de registro</dt><dd>${UI.date(c.registro)}</dd></div>
                        <div><dt>Pedidos</dt><dd>${orders.length}</dd></div><div><dt>Total gastado</dt><dd>${UI.money(spent(c.id))}</dd></div>
                    </dl></div></article></div>
                <div class="col-12"><article class="gs-card"><div class="gs-card-header"><h2>Historial de pedidos</h2></div>
                    ${orders.length ? `<div class="table-responsive"><table class="table gs-table table-hover align-middle mb-0"><thead><tr><th>ID</th><th>Fecha</th><th>Productos</th><th class="num">Total</th><th>Pago</th><th>Estado</th><th class="text-end">Acción</th></tr></thead><tbody>
                    ${orders.map((o) => `<tr><td><a href="pedido-detalle.html?id=${UI.esc(o.id)}" class="fw-semibold">#${UI.esc(o.id)}</a></td><td>${UI.date(o.fecha)}</td>
                        <td>${UI.esc(o.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(', '))}</td><td class="num">${UI.money(o.total)}</td><td>${UI.esc(o.pago)}</td><td>${UI.badge(o.estado)}</td>
                        <td class="text-end"><a class="btn-icon primary" href="pedido-detalle.html?id=${UI.esc(o.id)}" aria-label="Ver pedido ${UI.esc(o.id)}"><i class="bi bi-eye"></i></a></td></tr>`).join('')}</tbody></table></div>`
                    : UI.stateEmpty({ icon: 'bi-bag', title: 'Sin pedidos', text: 'Este cliente aún no ha realizado compras.' })}</article></div></div>`;
            document.getElementById('cEdit').addEventListener('click', () => openForm(c.id, render));
        };
        render();
    }

    return { find, all, initList, initDetail };
})();
