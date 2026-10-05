/* =========================================================
   auth.js — Simulación de sesión (solo frontend, NO es seguridad real)
   ========================================================= */
const Auth = (() => {
    const KEY = 'gamestore_logged_in';
    const DEMO_EMAIL = 'admin@gamestore.com';

    const isLoggedIn = () => {
        try { return localStorage.getItem(KEY) === 'true' || sessionStorage.getItem(KEY) === 'true'; } catch (e) { return false; }
    };

    function login(email, password, remember) {
        const user = DB.get('user');
        const mail = email.trim().toLowerCase();
        const ok = (mail === DEMO_EMAIL || mail === String(user.email).toLowerCase()) && password === user.password;
        if (ok) (remember ? localStorage : sessionStorage).setItem(KEY, 'true');
        return ok;
    }

    function logout() {
        localStorage.removeItem(KEY);
        sessionStorage.removeItem(KEY);
    }

    // Pantalla de login
    function initLoginPage() {
        const form = document.getElementById('loginForm');
        if (!form) return;
        DB.init();
        if (isLoggedIn()) { location.replace('pages/dashboard.html'); return; }

        const pass = document.getElementById('password');
        document.getElementById('togglePass').addEventListener('click', (e) => {
            const show = pass.type === 'password';
            pass.type = show ? 'text' : 'password';
            e.currentTarget.innerHTML = `<i class="bi ${show ? 'bi-eye-slash' : 'bi-eye'}"></i>`;
            e.currentTarget.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
        });
        document.getElementById('fillDemo').addEventListener('click', () => {
            form.elements.email.value = DEMO_EMAIL;
            pass.value = '123456';
        });
        document.getElementById('forgotLink').addEventListener('click', (e) => {
            e.preventDefault();
            UI.info('Recuperar contraseña', 'Esto es una demostración: usa admin@gamestore.com y la contraseña 123456.');
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const errors = {};
            const email = form.elements.email.value.trim();
            if (!email) errors.email = 'Ingresa tu correo electrónico.';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Ingresa un correo válido.';
            if (!pass.value) errors.password = 'Ingresa tu contraseña.';
            if (!UI.showErrors(form, errors)) return;

            if (login(email, pass.value, form.elements.remember.checked)) {
                Swal.fire({ ...themeless(), icon: 'success', title: '¡Bienvenido, Steven!', text: 'Accediendo al panel…', timer: 1100, showConfirmButton: false })
                    .then(() => location.replace('pages/dashboard.html'));
            } else {
                UI.error('Credenciales incorrectas', 'El correo o la contraseña no coinciden. Usa los datos de demostración.');
            }
        });
    }
    const themeless = () => UI.theme ? UI.theme() : {};

    document.addEventListener('DOMContentLoaded', initLoginPage);
    return { isLoggedIn, login, logout };
})();
