/* =========================================================
   storage.js — Capa de acceso a LocalStorage
   Si no hay datos guardados, usa los iniciales de data.js.
   ========================================================= */
const DB = (() => {
    const KEYS = {
        products: 'gamestore_products',
        categories: 'gamestore_categories',
        customers: 'gamestore_customers',
        orders: 'gamestore_orders',
        settings: 'gamestore_settings',
        notifications: 'gamestore_notifications',
        user: 'gamestore_user'
    };
    const clone = (o) => JSON.parse(JSON.stringify(o));

    function read(name) {
        try {
            const raw = localStorage.getItem(KEYS[name]);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function write(name, value) {
        localStorage.setItem(KEYS[name], JSON.stringify(value));
        return value;
    }

    // Crea los datos iniciales si LocalStorage está vacío
    function init() {
        Object.keys(KEYS).forEach((name) => {
            if (read(name) === null) {
                try { write(name, clone(SEED[name])); } catch (e) { /* almacenamiento no disponible */ }
            }
        });
    }

    function get(name) {
        const value = read(name);
        return value === null ? clone(SEED[name]) : value;
    }

    const nextId = (list) => list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;

    function nextOrderId() {
        const max = get('orders').reduce((m, o) => Math.max(m, parseInt(String(o.id).replace(/\D/g, ''), 10) || 0), 1000);
        return 'GS-' + (max + 1);
    }

    function reset() {
        Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
        init();
    }

    return { init, get, set: write, nextId, nextOrderId, reset, KEYS };
})();
