/* =========================================================
   notifications.js — Notificaciones del panel (LocalStorage)
   ========================================================= */
const Notifications = (() => {
    const ICONS = {
        stock: ['bi-exclamation-triangle', 'tone-warning'],
        pedido: ['bi-bag-check', 'tone-success'],
        cliente: ['bi-person-plus', 'tone-info'],
        info: ['bi-info-circle', 'tone-primary']
    };
    const SETTING = { stock: 'stock', pedido: 'pedidos', cliente: 'clientes' };

    const all = () => DB.get('notifications');
    const unread = () => all().filter((n) => !n.leida).length;

    // Agrega una notificación respetando las preferencias de Configuración
    function add(texto, tipo = 'info') {
        const prefs = DB.get('settings').notif || {};
        if (SETTING[tipo] && prefs[SETTING[tipo]] === false) return;
        const list = all();
        list.unshift({ id: DB.nextId(list), tipo, texto, fecha: new Date().toISOString(), leida: false });
        DB.set('notifications', list.slice(0, 40));
        render();
    }

    function markAllRead() {
        DB.set('notifications', all().map((n) => ({ ...n, leida: true })));
        render();
    }

    function clearAll() {
        DB.set('notifications', []);
        render();
    }

    // Pinta el contador y la lista del dropdown
    function render() {
        const badge = document.getElementById('notifBadge');
        const list = document.getElementById('notifList');
        const count = unread();
        if (badge) {
            badge.textContent = count > 9 ? '9+' : count;
            badge.classList.toggle('d-none', count === 0);
        }
        const title = document.getElementById('notifCount');
        if (title) title.textContent = count ? `${count} sin leer` : 'Todo al día';
        if (!list) return;
        const items = all();
        list.innerHTML = items.length ? items.map((n) => {
            const [icon, tone] = ICONS[n.tipo] || ICONS.info;
            return `<div class="notif-item ${n.leida ? '' : 'unread'}"><span class="ico ${tone}"><i class="bi ${icon}"></i></span>
                <div><p>${UI.esc(n.texto)}</p><small>${UI.timeAgo(n.fecha)}</small></div></div>`;
        }).join('') : '<div class="state-block py-4"><i class="bi bi-bell-slash state-icon"></i><p class="mb-0">No tienes notificaciones.</p></div>';
    }

    return { all, unread, add, markAllRead, clearAll, render };
})();
