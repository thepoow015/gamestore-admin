/* =========================================================
   products.js — CRUD de productos (listado, formulario, detalle)
   ========================================================= */
const Products = (() => {
    const PER_PAGE = 8;
    const state = { q: '', cat: '', plat: '', estado: '', sort: 'creado:desc', page: 1, selected: new Set() };

    /* ---------- Datos ---------- */
    const all = () => DB.get('products');
    const find = (id) => all().find((p) => p.id === Number(id));

    // Disponible / Stock bajo / Agotado (según stock y stock mínimo) o Inactivo si se desactivó
    function status(p) {
        if (p.activo === false) return 'Inactivo';
        if (p.stock === 0) return 'Agotado';
        if (p.stock <= (p.stockMinimo ?? 10)) return 'Stock bajo';
        return 'Disponible';
    }

    function validate(d, editingId) {
        const e = {};
        const req = (k, msg) => { if (!String(d[k] ?? '').trim()) e[k] = msg; };
        req('nombre', 'El nombre es obligatorio.');
        req('descripcion', 'La descripción es obligatoria.');
        req('categoria', 'Selecciona una categoría.');
        req('plataforma', 'Selecciona una plataforma.');
        req('sku', 'El SKU es obligatorio.');
        req('desarrollador', 'Indica el desarrollador.');
        req('publisher', 'Indica el publisher.');
        if (d.precio === '' || isNaN(Number(d.precio))) e.precio = 'Ingresa un precio numérico.';
        else if (Number(d.precio) <= 0) e.precio = 'El precio debe ser mayor que cero.';
        if (d.precioAnterior !== '' && (isNaN(Number(d.precioAnterior)) || Number(d.precioAnterior) < 0)) e.precioAnterior = 'Ingresa un valor numérico válido.';
        if (d.stock === '' || isNaN(Number(d.stock))) e.stock = 'Ingresa un stock numérico.';
        else if (Number(d.stock) < 0 || !Number.isInteger(Number(d.stock))) e.stock = 'El stock debe ser un entero no negativo.';
        if (d.stockMinimo === '' || isNaN(Number(d.stockMinimo)) || Number(d.stockMinimo) < 0) e.stockMinimo = 'Ingresa un stock mínimo válido.';
        const y = Number(d.lanzamiento);
        if (!Number.isInteger(y) || y < 1970 || y > 2035) e.lanzamiento = 'Ingresa un año entre 1970 y 2035.';
        if (d.sku && all().some((p) => p.sku.toLowerCase() === d.sku.trim().toLowerCase() && p.id !== editingId)) e.sku = 'Ya existe un producto con ese SKU.';
        return e;
    }

    function save(d, editingId, image) {
        const list = all();
        const payload = {
            nombre: d.nombre.trim(), descripcion: d.descripcion.trim(), categoria: d.categoria, plataforma: d.plataforma,
            precio: Number(d.precio), precioAnterior: Number(d.precioAnterior || 0), stock: Number(d.stock), stockMinimo: Number(d.stockMinimo),
            sku: d.sku.trim(), desarrollador: d.desarrollador.trim(), publisher: d.publisher.trim(), lanzamiento: Number(d.lanzamiento),
            imagen: image || '', activo: d.activo === 'on' || d.activo === true
        };
        let saved;
        if (editingId) {
            const i = list.findIndex((p) => p.id === editingId);
            saved = { ...list[i], ...payload, actualizado: UI.today() };
            list[i] = saved;
        } else {
            saved = { id: DB.nextId(list), vendidos: 0, creado: UI.today(), actualizado: UI.today(), ...payload };
            list.push(saved);
        }
        saved.estado = status(saved);
        DB.set('products', list);
        return saved;
    }

    const remove = (id) => DB.set('products', all().filter((p) => p.id !== id));

    /* ---------- Formulario (modal compartido) ---------- */
    let modalEl, onSaved = () => {}, editingId = null, currentImage = '';

    function mountModal() {
        if (document.getElementById('productModal')) return;
        const cats = DB.get('categories').filter((c) => c.estado === 'Activa').map((c) => c.nombre);
        const f = (l, n, o) => UI.field(l, n, { p: 'prod', ...o });
        const body = `<form id="productForm" novalidate class="row g-3">
            <div class="col-12 form-section-title">Información general</div>
            ${f('Nombre', 'nombre', { required: true, col: 'col-12', placeholder: 'Ej. Elden Ring' })}
            ${f('Descripción', 'descripcion', { required: true, col: 'col-12', textarea: true, placeholder: 'Describe el juego en una o dos frases' })}
            ${f('Categoría', 'categoria', { required: true, options: [['', 'Selecciona…'], ...cats] })}
            ${f('Plataforma', 'plataforma', { required: true, options: [['', 'Selecciona…'], ...SEED.PLATAFORMAS] })}
            <div class="col-12 form-section-title">Precio</div>
            ${f('Precio (RD$)', 'precio', { required: true, type: 'number', attrs: 'min="0" step="1"' })}
            ${f('Precio anterior (RD$)', 'precioAnterior', { type: 'number', attrs: 'min="0" step="1"', placeholder: 'Opcional' })}
            <div class="col-12 form-section-title">Inventario</div>
            ${f('Stock', 'stock', { required: true, type: 'number', col: 'col-md-4', attrs: 'min="0" step="1"' })}
            ${f('Stock mínimo', 'stockMinimo', { required: true, type: 'number', col: 'col-md-4', attrs: 'min="0" step="1"' })}
            ${f('SKU', 'sku', { required: true, col: 'col-md-4', placeholder: 'XXXX-PS5-000' })}
            <div class="col-12 form-section-title">Información del juego</div>
            ${f('Desarrollador', 'desarrollador', { required: true, col: 'col-md-4' })}
            ${f('Publisher', 'publisher', { required: true, col: 'col-md-4' })}
            ${f('Año de lanzamiento', 'lanzamiento', { required: true, type: 'number', col: 'col-md-4', attrs: 'min="1970" max="2035"' })}
            <div class="col-12 form-section-title">Imagen</div>
            <div class="col-md-8">
                <label class="form-label" for="prod-imagenUrl">URL de la imagen (opcional)</label>
                <input class="form-control mb-2" type="url" id="prod-imagenUrl" name="imagenUrl" placeholder="https://…">
                <label class="form-label" for="prod-imagenFile">…o sube un archivo</label>
                <input class="form-control" type="file" id="prod-imagenFile" accept="image/*">
                <div class="form-text">Si no agregas imagen se usa una portada generada automáticamente.</div>
            </div>
            <div class="col-md-4 d-flex align-items-center justify-content-center"><img id="prodPreview" class="img-preview" alt="Vista previa de la portada" src=""></div>
            <div class="col-12"><div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="prod-activo" name="activo" checked><label class="form-check-label" for="prod-activo">Producto activo en el catálogo</label></div></div>
        </form>`;
        modalEl = UI.mountModal({
            id: 'productModal', title: 'Producto', body, size: 'modal-xl',
            footer: '<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button><button type="submit" form="productForm" class="btn btn-primary" id="prodSubmit"><i class="bi bi-check-lg me-1"></i>Guardar producto</button>'
        });
        const form = document.getElementById('productForm');
        const preview = document.getElementById('prodPreview');
        const refreshPreview = () => {
            const draft = { nombre: form.elements.nombre.value || 'GameStore', categoria: form.elements.categoria.value, plataforma: form.elements.plataforma.value };
            preview.dataset.fallback = UI.cover(draft);
            preview.src = currentImage || UI.cover(draft);
        };
        form.addEventListener('input', (e) => { if (['nombre', 'categoria', 'plataforma'].includes(e.target.name)) refreshPreview(); });
        form.elements.imagenUrl.addEventListener('input', (e) => { currentImage = e.target.value.trim(); refreshPreview(); });
        document.getElementById('prod-imagenFile').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try { currentImage = await UI.readImage(file); form.elements.imagenUrl.value = ''; refreshPreview(); } catch (err) { UI.error('Imagen no válida', 'No se pudo leer el archivo seleccionado.'); }
        });
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = UI.readForm(form);
            data.activo = form.elements.activo.checked;
            if (!UI.showErrors(form, validate(data, editingId))) return;
            let saved;
            try { saved = save(data, editingId, currentImage); } catch (err) { return UI.error('No se pudo guardar', 'El almacenamiento local está lleno. Usa una imagen más pequeña.'); }
            const wasEdit = !!editingId;
            UI.modal(modalEl).hide();
            UI.toast(wasEdit ? 'Producto actualizado.' : 'Producto guardado correctamente.');
            if (saved.stock <= saved.stockMinimo) setTimeout(() => UI.toast('Este producto tiene poco stock.', 'warning'), 900);
            onSaved(saved);
        });
        modalEl.addEventListener('shown.bs.modal', () => form.elements.nombre.focus());
    }

    function openForm(id, cb) {
        mountModal();
        onSaved = cb || (() => {});
        editingId = id ? Number(id) : null;
        const form = document.getElementById('productForm');
        UI.clearErrors(form);
        form.reset();
        const p = editingId ? find(editingId) : null;
        currentImage = p ? p.imagen : '';
        document.getElementById('productModalLabel').textContent = p ? 'Editar producto' : 'Agregar producto';
        document.getElementById('prodSubmit').innerHTML = `<i class="bi bi-check-lg me-1"></i>${p ? 'Guardar cambios' : 'Guardar producto'}`;
        if (p) {
            UI.setForm(form, p);
            form.elements.activo.checked = p.activo !== false;
            form.elements.imagenUrl.value = /^https?:/.test(p.imagen) ? p.imagen : '';
        } else {
            UI.setForm(form, { stock: 10, stockMinimo: 10, lanzamiento: new Date().getFullYear() });
            form.elements.activo.checked = true;
        }
        const preview = document.getElementById('prodPreview');
        const draft = p || { nombre: 'GameStore', categoria: '', plataforma: '' };
        preview.dataset.fallback = UI.cover(draft);
        preview.src = currentImage || UI.cover(draft);
        UI.modal(modalEl).show();
    }

    async function confirmDelete(id) {
        const p = find(id);
        if (!p) return false;
        const ok = await UI.confirm({ title: '¿Eliminar producto?', text: 'Esta acción no se puede deshacer.' });
        if (ok) { remove(p.id); state.selected.delete(p.id); UI.toast('Producto eliminado correctamente.'); }
        return ok;
    }

    /* ---------- Listado ---------- */
    function filtered() {
        let list = all();
        const t = state.q.trim().toLowerCase();
        if (t) list = list.filter((p) => [p.nombre, p.sku, p.desarrollador, p.publisher].some((v) => String(v).toLowerCase().includes(t)));
        if (state.cat) list = list.filter((p) => p.categoria === state.cat);
        if (state.plat) list = list.filter((p) => p.plataforma === state.plat);
        if (state.estado) list = list.filter((p) => status(p) === state.estado);
        const [key, dir] = state.sort.split(':');
        const m = dir === 'desc' ? -1 : 1;
        return list.sort((a, b) => (typeof a[key] === 'string' ? a[key].localeCompare(b[key], 'es') : a[key] - b[key]) * m);
    }

    function row(p) {
        const st = status(p);
        const checked = state.selected.has(p.id) ? 'checked' : '';
        return `<tr>
            <td><input class="form-check-input row-check" type="checkbox" data-id="${p.id}" ${checked} aria-label="Seleccionar ${UI.esc(p.nombre)}"></td>
            <td>${UI.img(p, 'thumb')}</td>
            <td><div class="cell-main"><div><a href="producto-detalle.html?id=${p.id}" class="fw-semibold text-reset">${UI.esc(p.nombre)}</a><small class="d-block">${UI.esc(p.sku)}</small></div></div></td>
            <td>${UI.badge(p.categoria)}</td><td>${UI.esc(p.plataforma)}</td>
            <td class="num">${UI.money(p.precio)}${p.precioAnterior > p.precio ? `<span class="old-price">${UI.money(p.precioAnterior)}</span>` : ''}</td>
            <td class="num ${p.stock <= (p.stockMinimo ?? 10) ? 'text-warning fw-semibold' : ''}">${p.stock}</td>
            <td>${UI.badge(st, st === 'Stock bajo' ? 'Este producto tiene poco stock.' : '')}</td>
            <td>${UI.date(p.creado)}</td>
            <td><div class="actions">
                <a class="btn-icon primary" href="producto-detalle.html?id=${p.id}" aria-label="Ver ${UI.esc(p.nombre)}" title="Ver"><i class="bi bi-eye"></i></a>
                <button class="btn-icon" type="button" data-action="edit" data-id="${p.id}" aria-label="Editar ${UI.esc(p.nombre)}" title="Editar"><i class="bi bi-pencil"></i></button>
                <button class="btn-icon danger" type="button" data-action="delete" data-id="${p.id}" aria-label="Eliminar ${UI.esc(p.nombre)}" title="Eliminar"><i class="bi bi-trash"></i></button></div></td></tr>`;
    }

    function renderList() {
        const stateEl = document.getElementById('listState');
        const wrap = document.getElementById('tableWrap');
        const pagerEl = document.getElementById('pager');
        let list;
        try { list = filtered(); } catch (e) {
            wrap.classList.add('d-none'); pagerEl.innerHTML = ''; stateEl.innerHTML = UI.stateError(); return;
        }
        if (!all().length) {
            wrap.classList.add('d-none'); pagerEl.innerHTML = '';
            stateEl.innerHTML = UI.stateEmpty({ icon: 'bi-controller', title: 'No hay productos registrados.', text: 'Agrega tu primer videojuego al catálogo.', button: '<button class="btn btn-primary" type="button" data-add><i class="bi bi-plus-lg me-1"></i>Agregar producto</button>' });
            return;
        }
        if (!list.length) {
            wrap.classList.add('d-none'); pagerEl.innerHTML = '';
            stateEl.innerHTML = UI.stateEmpty({ icon: 'bi-search', title: 'Sin resultados', text: 'Ningún producto coincide con los filtros aplicados.' });
            return;
        }
        const pages = Math.ceil(list.length / PER_PAGE);
        if (state.page > pages) state.page = pages;
        const slice = list.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE);
        stateEl.innerHTML = '';
        wrap.classList.remove('d-none');
        document.getElementById('productsBody').innerHTML = slice.map(row).join('');
        const allChecked = slice.length && slice.every((p) => state.selected.has(p.id));
        document.getElementById('checkAll').checked = !!allChecked;
        UI.pager(pagerEl, { total: list.length, page: state.page, perPage: PER_PAGE, onChange: (p) => { state.page = p; renderList(); } });
        renderBulk();
    }

    function renderBulk() {
        const bar = document.getElementById('bulkBar');
        const n = state.selected.size;
        bar.classList.toggle('d-none', n === 0);
        document.getElementById('bulkCount').textContent = `${n} ${n === 1 ? 'producto seleccionado' : 'productos seleccionados'}`;
    }

    function load() {
        const stateEl = document.getElementById('listState');
        document.getElementById('tableWrap').classList.add('d-none');
        stateEl.innerHTML = UI.stateLoading('Cargando productos…');
        setTimeout(renderList, 350);
    }

    function applyFiltersFromForm() {
        const f = document.getElementById('filtersForm').elements;
        Object.assign(state, { q: f.q.value, cat: f.cat.value, plat: f.plat.value, estado: f.estado.value, sort: f.sort.value, page: 1 });
        renderList();
    }

    async function bulkAction(action) {
        const ids = [...state.selected];
        if (!ids.length) return;
        if (action === 'delete') {
            const ok = await UI.confirm({ title: `¿Eliminar ${ids.length} producto(s)?`, text: 'Esta acción no se puede deshacer.' });
            if (!ok) return;
            DB.set('products', all().filter((p) => !state.selected.has(p.id)));
            UI.toast('Productos eliminados correctamente.');
        } else {
            const activo = action === 'activate';
            DB.set('products', all().map((p) => (state.selected.has(p.id) ? { ...p, activo, estado: status({ ...p, activo }), actualizado: UI.today() } : p)));
            UI.toast(activo ? 'Productos activados.' : 'Productos desactivados.');
        }
        state.selected.clear();
        renderList();
    }

    function initList() {
        const cats = DB.get('categories').map((c) => c.nombre);
        const fill = (name, values) => { document.getElementById(name).insertAdjacentHTML('beforeend', values.map((v) => `<option value="${UI.esc(v)}">${UI.esc(v)}</option>`).join('')); };
        fill('fCat', cats); fill('fPlat', SEED.PLATAFORMAS); fill('fEstado', ['Disponible', 'Stock bajo', 'Agotado', 'Inactivo']);

        const form = document.getElementById('filtersForm');
        form.addEventListener('submit', (e) => { e.preventDefault(); applyFiltersFromForm(); });
        form.elements.q.addEventListener('input', UI.debounce(applyFiltersFromForm, 250));
        ['cat', 'plat', 'estado', 'sort'].forEach((n) => form.elements[n].addEventListener('change', applyFiltersFromForm));
        document.getElementById('btnClear').addEventListener('click', () => { form.reset(); applyFiltersFromForm(); });
        document.getElementById('btnAdd').addEventListener('click', () => openForm(null, renderList));

        document.getElementById('listState').addEventListener('click', (e) => {
            if (e.target.closest('[data-retry]')) load();
            if (e.target.closest('[data-add]')) openForm(null, renderList);
        });
        document.getElementById('productsBody').addEventListener('click', async (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            if (btn.dataset.action === 'edit') openForm(btn.dataset.id, renderList);
            if (btn.dataset.action === 'delete' && await confirmDelete(btn.dataset.id)) renderList();
        });
        document.getElementById('productsBody').addEventListener('change', (e) => {
            if (!e.target.classList.contains('row-check')) return;
            const id = Number(e.target.dataset.id);
            e.target.checked ? state.selected.add(id) : state.selected.delete(id);
            renderBulk();
        });
        document.getElementById('checkAll').addEventListener('change', (e) => {
            document.querySelectorAll('.row-check').forEach((c) => {
                c.checked = e.target.checked;
                e.target.checked ? state.selected.add(Number(c.dataset.id)) : state.selected.delete(Number(c.dataset.id));
            });
            renderBulk();
        });
        document.getElementById('bulkBar').addEventListener('click', (e) => {
            const b = e.target.closest('[data-bulk]');
            if (b) bulkAction(b.dataset.bulk);
        });
        load();
    }

    /* ---------- Detalle ---------- */
    function initDetail() {
        const root = document.getElementById('detailRoot');
        const id = new URLSearchParams(location.search).get('id');
        const render = () => {
            const p = find(id);
            if (!p) {
                root.innerHTML = UI.stateEmpty({ icon: 'bi-question-circle', title: 'Producto no encontrado', text: 'El producto no existe o fue eliminado.', button: '<a class="btn btn-primary" href="productos.html">Volver a productos</a>' });
                return;
            }
            const st = status(p);
            const disc = p.precioAnterior > p.precio ? Math.round((1 - p.precio / p.precioAnterior) * 100) : 0;
            root.innerHTML = `<div class="row g-4">
                <div class="col-lg-4 text-center"><img class="detail-cover" src="${UI.esc(p.imagen || UI.cover(p))}" data-fallback="${UI.esc(UI.cover(p))}" alt="Portada de ${UI.esc(p.nombre)}"></div>
                <div class="col-lg-8"><article class="gs-card"><div class="gs-card-body">
                    <div class="d-flex flex-wrap gap-2 mb-2">${UI.badge(p.categoria)}${UI.badge(st, st === 'Stock bajo' ? 'Este producto tiene poco stock.' : '')}<span class="badge badge-soft badge-secondary">${UI.esc(p.plataforma)}</span></div>
                    <h2 class="mb-1">${UI.esc(p.nombre)}</h2><p class="text-muted">${UI.esc(p.descripcion)}</p>
                    <div class="d-flex align-items-baseline gap-3 mb-4"><span class="price-big">${UI.money(p.precio)}</span>
                        ${p.precioAnterior > p.precio ? `<span class="old-price fs-6">${UI.money(p.precioAnterior)}</span><span class="badge badge-soft badge-success">-${disc}%</span>` : ''}</div>
                    <dl class="detail-list">
                        <div><dt>Stock</dt><dd>${p.stock} unidades</dd></div><div><dt>Stock mínimo</dt><dd>${p.stockMinimo}</dd></div><div><dt>SKU</dt><dd>${UI.esc(p.sku)}</dd></div>
                        <div><dt>Desarrollador</dt><dd>${UI.esc(p.desarrollador)}</dd></div><div><dt>Publisher</dt><dd>${UI.esc(p.publisher)}</dd></div><div><dt>Año</dt><dd>${p.lanzamiento}</dd></div>
                        <div><dt>Estado</dt><dd>${UI.badge(st)}</dd></div><div><dt>Registrado</dt><dd>${UI.date(p.creado)}</dd></div><div><dt>Actualizado</dt><dd>${UI.date(p.actualizado)}</dd></div>
                    </dl></div>
                    <div class="gs-card-footer d-flex flex-wrap gap-2">
                        <button class="btn btn-primary" type="button" id="dEdit"><i class="bi bi-pencil me-1"></i>Editar</button>
                        <button class="btn btn-outline-danger" type="button" id="dDelete"><i class="bi bi-trash me-1"></i>Eliminar</button>
                        <a class="btn btn-outline-secondary ms-auto" href="productos.html"><i class="bi bi-arrow-left me-1"></i>Volver</a></div></article></div></div>`;
            document.getElementById('dEdit').addEventListener('click', () => openForm(p.id, render));
            document.getElementById('dDelete').addEventListener('click', async () => {
                if (await confirmDelete(p.id)) setTimeout(() => { location.href = 'productos.html'; }, 900);
            });
        };
        render();
    }

    return { status, find, all, openForm, initList, initDetail };
})();
