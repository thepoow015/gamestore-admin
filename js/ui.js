/* =========================================================
   ui.js — Utilidades de interfaz reutilizables
   Formato, badges, imágenes con fallback, alertas, paginación,
   estados (loading / empty / error), formularios y CSV.
   ========================================================= */
const UI = (() => {
    // Escapa texto antes de insertarlo con innerHTML
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const money = (n) => 'RD$ ' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
    const num = (n) => Number(n || 0).toLocaleString('en-US');
    const pad = (n) => String(n).padStart(2, '0');
    const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
    const date = (iso) => {
        if (!iso) return '—';
        const [y, m, d] = String(iso).slice(0, 10).split('-');
        return `${d}/${m}/${y}`;
    };
    const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

    const timeAgo = (iso) => {
        const diff = Math.max(0, Date.now() - new Date(iso).getTime());
        const min = Math.floor(diff / 60000);
        if (min < 1) return 'Justo ahora';
        if (min < 60) return `Hace ${min} min`;
        const h = Math.floor(min / 60);
        if (h < 24) return `Hace ${h} h`;
        const d = Math.floor(h / 24);
        return `Hace ${d} ${d === 1 ? 'día' : 'días'}`;
    };

    /* ---------- Badges ---------- */
    const BADGES = {
        'Disponible': 'success', 'Stock bajo': 'warning', 'Agotado': 'danger', 'Inactivo': 'secondary',
        'Completado': 'success', 'Procesando': 'info', 'Pendiente': 'warning', 'Enviado': 'primary', 'Cancelado': 'danger',
        'Activo': 'success', 'Activa': 'success', 'Inactiva': 'secondary', 'Bloqueado': 'danger'
    };
    const badge = (text, title) =>
        `<span class="badge badge-soft badge-${BADGES[text] || 'secondary'}"${title ? ` title="${esc(title)}"` : ''}>${esc(text)}</span>`;

    /* ---------- Imágenes con fallback ---------- */
    const PALETTE = {
        'Acción': ['#ef4444', '#7c2d12'], 'Aventura': ['#14b8a6', '#134e4a'], 'RPG': ['#a855f7', '#3b0764'],
        'Shooter': ['#f59e0b', '#78350f'], 'Deportes': ['#22c55e', '#14532d'], 'Carreras': ['#38bdf8', '#0c4a6e'],
        'Terror': ['#64748b', '#0f172a'], 'Estrategia': ['#6366f1', '#1e1b4b'], 'Simulación': ['#ec4899', '#500724']
    };
    // Portada generada (SVG) para productos sin imagen o con imagen rota
    function cover(p) {
        const [a, b] = PALETTE[p.categoria] || ['#7c5cff', '#1e1b4b'];
        const words = String(p.nombre || 'GS').replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).filter(Boolean);
        const ini = esc((words.length === 1 ? words[0].slice(0, 2) : words.slice(0, 3).map((w) => w[0]).join('')).toUpperCase());
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="300" height="400" fill="url(#g)"/><circle cx="250" cy="60" r="90" fill="#fff" fill-opacity=".07"/><text x="150" y="212" font-family="Arial,sans-serif" font-size="92" font-weight="700" fill="#fff" fill-opacity=".92" text-anchor="middle">${ini}</text><text x="150" y="362" font-family="Arial,sans-serif" font-size="19" fill="#fff" fill-opacity=".75" text-anchor="middle">${esc(p.plataforma || 'GameStore')}</text></svg>`;
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }
    const img = (p, cls = 'thumb', alt) =>
        `<img class="${cls}" src="${esc(p.imagen || cover(p))}" data-fallback="${esc(cover(p))}" alt="${esc(alt || 'Portada de ' + p.nombre)}" loading="lazy">`;

    /* ---------- SweetAlert2 (tema acorde al modo actual) ---------- */
    const theme = () => {
        const cs = getComputedStyle(document.documentElement);
        return { background: cs.getPropertyValue('--surface').trim(), color: cs.getPropertyValue('--text').trim() };
    };
    const toast = (title, icon = 'success') => Swal.fire({
        ...theme(), toast: true, position: 'top-end', icon, title, showConfirmButton: false, timer: 2800, timerProgressBar: true
    });
    const success = (title, text) => Swal.fire({ ...theme(), icon: 'success', title, text, confirmButtonColor: '#7c5cff', confirmButtonText: 'Aceptar' });
    const error = (title, text) => Swal.fire({ ...theme(), icon: 'error', title, text, confirmButtonColor: '#7c5cff', confirmButtonText: 'Entendido' });
    const info = (title, text) => Swal.fire({ ...theme(), icon: 'info', title, text, confirmButtonColor: '#7c5cff', confirmButtonText: 'Aceptar' });
    const confirm = ({ title, text, confirmText = 'Eliminar', danger = true }) => Swal.fire({
        ...theme(), icon: 'warning', title, text, showCancelButton: true, confirmButtonText: confirmText, cancelButtonText: 'Cancelar',
        reverseButtons: true, focusCancel: true, confirmButtonColor: danger ? '#ef4444' : '#7c5cff', cancelButtonColor: '#475569'
    }).then((r) => r.isConfirmed);

    /* ---------- Paginación ---------- */
    function pager(el, { total, page, perPage, onChange }) {
        const pages = Math.max(1, Math.ceil(total / perPage));
        const from = total ? (page - 1) * perPage + 1 : 0;
        const to = Math.min(total, page * perPage);
        const nums = [];
        for (let i = 1; i <= pages; i++) {
            if (pages <= 7 || i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
            else if (nums[nums.length - 1] !== '…') nums.push('…');
        }
        const items = nums.map((n) => n === '…'
            ? '<li class="page-item disabled"><span class="page-link">…</span></li>'
            : `<li class="page-item ${n === page ? 'active' : ''}"><a class="page-link" href="#" data-page="${n}" ${n === page ? 'aria-current="page"' : ''}>${n}</a></li>`).join('');
        el.innerHTML = `<div class="pager-wrap"><small class="text-muted">Mostrando ${from}–${to} de ${total}</small>
            <nav aria-label="Paginación"><ul class="pagination pagination-sm mb-0">
            <li class="page-item ${page === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${page - 1}">Anterior</a></li>${items}
            <li class="page-item ${page === pages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${page + 1}">Siguiente</a></li></ul></nav></div>`;
        el.onclick = (e) => {
            const a = e.target.closest('[data-page]');
            if (!a) return;
            e.preventDefault();
            const p = Number(a.dataset.page);
            if (p >= 1 && p <= pages && p !== page) onChange(p);
        };
    }

    /* ---------- Estados de la interfaz ---------- */
    const stateLoading = (msg = 'Cargando datos…') =>
        `<div class="state-block" role="status"><div class="spinner-border text-primary" aria-hidden="true"></div><p class="mt-3 mb-0">${esc(msg)}</p></div>`;
    const stateEmpty = ({ icon = 'bi-inbox', title, text = '', button = '' }) =>
        `<div class="state-block"><i class="bi ${icon} state-icon" aria-hidden="true"></i><h3>${esc(title)}</h3><p>${esc(text)}</p>${button}</div>`;
    const stateError = () =>
        `<div class="state-block error"><i class="bi bi-exclamation-octagon state-icon" aria-hidden="true"></i><h3>No fue posible cargar los datos.</h3><p>Ocurrió un problema al leer la información.</p><button class="btn btn-outline-primary" data-retry type="button"><i class="bi bi-arrow-clockwise"></i> Reintentar</button></div>`;

    /* ---------- Formularios ---------- */
    // Genera un campo con label, control y mensaje de validación
    function field(label, name, o = {}) {
        const id = `${o.p || 'f'}-${name}`;
        const req = o.required ? ' <span class="text-danger" aria-hidden="true">*</span>' : '';
        let ctrl;
        if (o.options) {
            ctrl = `<select class="form-select" id="${id}" name="${name}"${o.disabled ? ' disabled' : ''}>${o.options.map((v) => {
                const [val, txt] = Array.isArray(v) ? v : [v, v];
                return `<option value="${esc(val)}">${esc(txt)}</option>`;
            }).join('')}</select>`;
        } else if (o.textarea) {
            ctrl = `<textarea class="form-control" id="${id}" name="${name}" rows="${o.rows || 3}" placeholder="${esc(o.placeholder || '')}"></textarea>`;
        } else {
            ctrl = `<input class="form-control" id="${id}" name="${name}" type="${o.type || 'text'}" placeholder="${esc(o.placeholder || '')}" ${o.attrs || ''}${o.readonly ? ' readonly' : ''}>`;
        }
        return `<div class="${o.col || 'col-md-6'}"><label class="form-label" for="${id}">${label}${req}</label>${ctrl}<div class="invalid-feedback"></div></div>`;
    }
    function clearErrors(form) {
        form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
    }
    function showErrors(form, errors) {
        clearErrors(form);
        let first = null;
        Object.entries(errors).forEach(([name, msg]) => {
            const input = form.elements[name];
            if (!input) return;
            input.classList.add('is-invalid');
            const fb = input.parentElement.querySelector('.invalid-feedback');
            if (fb) fb.textContent = msg;
            first = first || input;
        });
        if (first) first.focus();
        return Object.keys(errors).length === 0;
    }
    function setForm(form, data) {
        Object.entries(data).forEach(([k, v]) => { if (form.elements[k] && form.elements[k].type !== 'file') form.elements[k].value = v ?? ''; });
    }
    const readForm = (form) => Object.fromEntries(new FormData(form).entries());

    // Crea un modal Bootstrap una sola vez y devuelve su elemento
    function mountModal({ id, title, body, footer, size = 'modal-lg' }) {
        let el = document.getElementById(id);
        if (!el) {
            document.body.insertAdjacentHTML('beforeend', `<div class="modal fade" id="${id}" tabindex="-1" aria-labelledby="${id}Label" aria-hidden="true">
                <div class="modal-dialog ${size} modal-dialog-scrollable modal-dialog-centered"><div class="modal-content">
                <div class="modal-header"><h2 class="modal-title fs-5" id="${id}Label">${esc(title)}</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>
                <div class="modal-body">${body}</div>${footer ? `<div class="modal-footer">${footer}</div>` : ''}</div></div></div>`);
            el = document.getElementById(id);
        }
        return el;
    }
    const modal = (el) => bootstrap.Modal.getOrCreateInstance(el);

    // Lee una imagen y la reduce para no saturar LocalStorage
    function readImage(file, maxW = 360) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = () => {
                const image = new Image();
                image.onerror = reject;
                image.onload = () => {
                    const scale = Math.min(1, maxW / image.width);
                    const c = document.createElement('canvas');
                    c.width = Math.round(image.width * scale);
                    c.height = Math.round(image.height * scale);
                    c.getContext('2d').drawImage(image, 0, 0, c.width, c.height);
                    resolve(c.toDataURL('image/jpeg', 0.82));
                };
                image.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    }

    /* ---------- Exportar CSV ---------- */
    function downloadCSV(filename, rows) {
        const text = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
        const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

    const debounce = (fn, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

    // Colores de Chart.js según el tema activo
    const chartTheme = () => {
        const cs = getComputedStyle(document.documentElement);
        return { text: cs.getPropertyValue('--muted').trim(), grid: cs.getPropertyValue('--border').trim(), surface: cs.getPropertyValue('--surface').trim() };
    };
    const CHART_COLORS = ['#7c5cff', '#22d3ee', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#38bdf8', '#a3e635', '#94a3b8'];

    return {
        esc, money, num, today, date, initials, timeAgo, badge, cover, img, theme, toast, success, error, info, confirm, pager,
        stateLoading, stateEmpty, stateError, field, clearErrors, showErrors, setForm, readForm, mountModal, modal,
        readImage, downloadCSV, debounce, chartTheme, CHART_COLORS
    };
})();
