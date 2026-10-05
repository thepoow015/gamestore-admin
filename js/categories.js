/* =========================================================
   categories.js — CRUD de categorías
   ========================================================= */
const Categories = (() => {
    const ICONS = ['bi-lightning-charge', 'bi-compass', 'bi-shield', 'bi-crosshair', 'bi-trophy', 'bi-speedometer', 'bi-moon-stars', 'bi-diagram-3', 'bi-house', 'bi-controller', 'bi-joystick', 'bi-puzzle', 'bi-music-note-beamed', 'bi-rocket-takeoff'];
    const all = () => DB.get('categories');
    const countProducts = (nombre) => DB.get('products').filter((p) => p.categoria === nombre).length;
    let modalEl, editingId = null;

    function mountModal() {
        if (document.getElementById('categoryModal')) return;
        const f = (l, n, o) => UI.field(l, n, { p: 'cat', ...o });
        const body = `<form id="categoryForm" novalidate class="row g-3">
            ${f('Nombre', 'nombre', { required: true, col: 'col-12', placeholder: 'Ej. Plataformas' })}
            ${f('Descripción', 'descripcion', { required: true, col: 'col-12', textarea: true })}
            ${f('Icono', 'icono', { col: 'col-md-6', options: ICONS })}
            ${f('Estado', 'estado', { col: 'col-md-6', options: ['Activa', 'Inactiva'] })}
        </form>`;
        modalEl = UI.mountModal({
            id: 'categoryModal', title: 'Categoría', body, size: '',
            footer: '<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button><button type="submit" form="categoryForm" class="btn btn-primary" id="catSubmit">Guardar categoría</button>'
        });
        const form = document.getElementById('categoryForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const d = UI.readForm(form);
            const errors = {};
            if (!d.nombre.trim()) errors.nombre = 'El nombre es obligatorio.';
            else if (all().some((c) => c.nombre.toLowerCase() === d.nombre.trim().toLowerCase() && c.id !== editingId)) errors.nombre = 'Ya existe una categoría con ese nombre.';
            if (!d.descripcion.trim()) errors.descripcion = 'La descripción es obligatoria.';
            if (!UI.showErrors(form, errors)) return;

            const list = all();
            if (editingId) {
                const i = list.findIndex((c) => c.id === editingId);
                const oldName = list[i].nombre;
                list[i] = { ...list[i], nombre: d.nombre.trim(), descripcion: d.descripcion.trim(), icono: d.icono, estado: d.estado };
                // Mantiene la relación con los productos si se renombra
                if (oldName !== list[i].nombre) DB.set('products', DB.get('products').map((p) => (p.categoria === oldName ? { ...p, categoria: list[i].nombre } : p)));
            } else {
                list.push({ id: DB.nextId(list), nombre: d.nombre.trim(), descripcion: d.descripcion.trim(), icono: d.icono, estado: d.estado });
            }
            DB.set('categories', list);
            UI.modal(modalEl).hide();
            UI.toast(editingId ? 'Categoría actualizada.' : 'Categoría guardada correctamente.');
            render();
        });
    }

    function openForm(id) {
        mountModal();
        editingId = id ? Number(id) : null;
        const form = document.getElementById('categoryForm');
        UI.clearErrors(form);
        form.reset();
        const c = editingId ? all().find((x) => x.id === editingId) : null;
        document.getElementById('categoryModalLabel').textContent = c ? 'Editar categoría' : 'Nueva categoría';
        if (c) UI.setForm(form, c);
        UI.modal(modalEl).show();
        modalEl.addEventListener('shown.bs.modal', () => form.elements.nombre.focus(), { once: true });
    }

    async function remove(id) {
        const c = all().find((x) => x.id === Number(id));
        if (!c) return;
        const n = countProducts(c.nombre);
        if (n > 0) return UI.error('No se puede eliminar', `La categoría "${c.nombre}" tiene ${n} producto(s) asociados. Reasígnalos antes de eliminarla.`);
        if (await UI.confirm({ title: '¿Eliminar categoría?', text: 'Esta acción no se puede deshacer.' })) {
            DB.set('categories', all().filter((x) => x.id !== c.id));
            UI.toast('Categoría eliminada correctamente.');
            render();
        }
    }

    function render() {
        const body = document.getElementById('categoriesBody');
        const stateEl = document.getElementById('listState');
        const list = all();
        const wrap = document.getElementById('tableWrap');
        if (!list.length) {
            wrap.classList.add('d-none');
            stateEl.innerHTML = UI.stateEmpty({ icon: 'bi-grid', title: 'No hay categorías registradas.', button: '<button class="btn btn-primary" type="button" data-add><i class="bi bi-plus-lg me-1"></i>Nueva categoría</button>' });
            return;
        }
        stateEl.innerHTML = '';
        wrap.classList.remove('d-none');
        body.innerHTML = list.map((c) => `<tr>
            <td><div class="cell-main"><span class="category-icon"><i class="bi ${UI.esc(c.icono)}" aria-hidden="true"></i></span><strong>${UI.esc(c.nombre)}</strong></div></td>
            <td class="text-muted">${UI.esc(c.descripcion)}</td>
            <td class="num"><a href="productos.html" class="fw-semibold">${countProducts(c.nombre)}</a></td>
            <td>${UI.badge(c.estado)}</td>
            <td><div class="actions"><button class="btn-icon" type="button" data-action="edit" data-id="${c.id}" aria-label="Editar ${UI.esc(c.nombre)}"><i class="bi bi-pencil"></i></button>
            <button class="btn-icon danger" type="button" data-action="delete" data-id="${c.id}" aria-label="Eliminar ${UI.esc(c.nombre)}"><i class="bi bi-trash"></i></button></div></td></tr>`).join('');
    }

    function init() {
        document.getElementById('btnAdd').addEventListener('click', () => openForm());
        document.getElementById('listState').addEventListener('click', (e) => { if (e.target.closest('[data-add]')) openForm(); });
        document.getElementById('categoriesBody').addEventListener('click', (e) => {
            const b = e.target.closest('[data-action]');
            if (!b) return;
            b.dataset.action === 'edit' ? openForm(b.dataset.id) : remove(b.dataset.id);
        });
        render();
    }
    return { init };
})();
