/* =========================================================
   settings.js — Configuración de la tienda y perfil del usuario
   ========================================================= */
const Settings = (() => {
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    /* ---------- Configuración ---------- */
    function initConfig() {
        const s = DB.get('settings');
        const gen = document.getElementById('generalForm');
        UI.setForm(gen, s.tienda);

        gen.addEventListener('submit', (e) => {
            e.preventDefault();
            const d = UI.readForm(gen);
            const errors = {};
            if (!d.nombre.trim()) errors.nombre = 'El nombre de la tienda es obligatorio.';
            if (!EMAIL_RE.test(d.email.trim())) errors.email = 'Ingresa un email válido.';
            if (!d.telefono.trim()) errors.telefono = 'El teléfono es obligatorio.';
            if (!d.direccion.trim()) errors.direccion = 'La dirección es obligatoria.';
            if (!UI.showErrors(gen, errors)) return;
            const cur = DB.get('settings');
            cur.tienda = { nombre: d.nombre.trim(), email: d.email.trim(), telefono: d.telefono.trim(), direccion: d.direccion.trim() };
            DB.set('settings', cur);
            UI.success('Configuración guardada', 'Los datos de la tienda se actualizaron correctamente.');
        });

        // Apariencia
        const themeSel = document.getElementById('themeSelect');
        themeSel.value = GS.getTheme();
        themeSel.addEventListener('change', () => {
            GS.setTheme(themeSel.value);
            const cur = DB.get('settings'); cur.tema = themeSel.value; DB.set('settings', cur);
            UI.toast('Tema actualizado.');
        });
        document.addEventListener('gs:theme', (e) => { themeSel.value = e.detail; });

        const logoPrev = document.getElementById('logoPreview');
        const showLogo = (src) => { logoPrev.innerHTML = src ? `<img src="${UI.esc(src)}" alt="Logo de la tienda">` : '<i class="bi bi-controller"></i>'; };
        showLogo(s.logo);
        document.getElementById('logoFile').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const data = await UI.readImage(file, 160);
                const cur = DB.get('settings'); cur.logo = data; DB.set('settings', cur);
                showLogo(data);
                UI.toast('Logo actualizado. Se verá en el menú al recargar.');
            } catch (err) { UI.error('Imagen no válida', 'No se pudo cargar el logo.'); }
        });
        document.getElementById('logoReset').addEventListener('click', () => {
            const cur = DB.get('settings'); cur.logo = ''; DB.set('settings', cur); showLogo('');
            document.getElementById('logoFile').value = '';
            UI.toast('Logo restablecido.');
        });

        // Notificaciones
        ['pedidos', 'stock', 'clientes'].forEach((k) => {
            const sw = document.getElementById('notif-' + k);
            sw.checked = s.notif[k] !== false;
            sw.addEventListener('change', () => {
                const cur = DB.get('settings'); cur.notif[k] = sw.checked; DB.set('settings', cur);
                UI.toast('Configuración guardada.');
            });
        });

        // Seguridad: cambio de contraseña (simulado)
        const pf = document.getElementById('passwordForm');
        pf.addEventListener('submit', (e) => {
            e.preventDefault();
            const d = UI.readForm(pf);
            const user = DB.get('user');
            const errors = {};
            if (d.actual !== user.password) errors.actual = 'La contraseña actual no es correcta.';
            if (d.nueva.length < 6) errors.nueva = 'La nueva contraseña debe tener al menos 6 caracteres.';
            if (d.confirmar !== d.nueva) errors.confirmar = 'Las contraseñas no coinciden.';
            if (!UI.showErrors(pf, errors)) return;
            user.password = d.nueva;
            DB.set('user', user);
            pf.reset();
            UI.success('Contraseña actualizada', 'Úsala la próxima vez que inicies sesión en esta demo.');
        });
        document.getElementById('sessionsList').addEventListener('click', async (e) => {
            const b = e.target.closest('[data-close-session]');
            if (!b) return;
            if (await UI.confirm({ title: '¿Cerrar esta sesión?', text: 'El dispositivo deberá iniciar sesión de nuevo.', confirmText: 'Cerrar sesión', danger: false })) {
                b.closest('li').remove();
                UI.toast('Sesión cerrada.');
            }
        });
        document.getElementById('resetData').addEventListener('click', async () => {
            if (await UI.confirm({ title: '¿Restablecer datos de demostración?', text: 'Se perderán los cambios hechos en productos, clientes y pedidos.', confirmText: 'Restablecer' })) {
                const logged = ['localStorage', 'sessionStorage'].map((k) => [k, window[k].getItem('gamestore_logged_in')]);
                DB.reset();
                logged.forEach(([k, v]) => { if (v) window[k].setItem('gamestore_logged_in', v); });
                await UI.success('Datos restablecidos', 'Se cargaron de nuevo los datos de demostración.');
                location.reload();
            }
        });
    }

    /* ---------- Perfil ---------- */
    function initProfile() {
        const form = document.getElementById('profileForm');
        const paint = () => {
            const u = DB.get('user');
            document.getElementById('pAvatar').textContent = UI.initials(u.nombre);
            document.getElementById('pName').textContent = u.nombre;
            document.getElementById('pRole').textContent = u.rol;
            document.getElementById('pEmail').textContent = u.email;
            document.getElementById('pPhone').textContent = u.telefono;
            document.getElementById('pRol2').textContent = u.rol;
            document.getElementById('pSince').textContent = UI.date(u.registro);
            UI.setForm(form, u);
        };
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const d = UI.readForm(form);
            const errors = {};
            if (!d.nombre.trim()) errors.nombre = 'El nombre es obligatorio.';
            if (!d.email.trim()) errors.email = 'El email es obligatorio.';
            else if (!EMAIL_RE.test(d.email.trim())) errors.email = 'Ingresa un email válido.';
            if (!d.telefono.trim()) errors.telefono = 'El teléfono es obligatorio.';
            if (!UI.showErrors(form, errors)) return;
            const u = DB.get('user');
            DB.set('user', { ...u, nombre: d.nombre.trim(), email: d.email.trim(), telefono: d.telefono.trim() });
            paint();
            UI.success('Perfil actualizado', 'Tus datos se guardaron correctamente. El menú se actualizará al navegar.');
        });
        paint();
    }

    return { initConfig, initProfile };
})();
