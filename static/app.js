// Global utilities

// Theme Management
const theme = {
    init() {
        const saved = localStorage.getItem('theme');
        if (saved) {
            document.documentElement.setAttribute('data-theme', saved);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    },

    toggle() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        return next;
    },

    isDark() {
        return document.documentElement.getAttribute('data-theme') === 'dark';
    }
};

// Initialize theme immediately
theme.init();

// Toast Notifications
const toast = {
    container: null,

    init() {
        if (this.container) return;
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    },

    show(message, type = 'info', duration = 3000) {
        this.init();
        const toastEl = document.createElement('div');
        toastEl.className = `toast ${type}`;
        toastEl.innerHTML = `
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
        `;
        this.container.appendChild(toastEl);

        if (duration > 0) {
            setTimeout(() => {
                toastEl.style.animation = 'toast-fade-out 0.3s ease-out forwards';
                setTimeout(() => toastEl.remove(), 300);
            }, duration);
        }
    },

    success(message, duration) { this.show(message, 'success', duration); },
    error(message, duration) { this.show(message, 'error', duration); },
    info(message, duration) { this.show(message, 'info', duration); },
    warning(message, duration) { this.show(message, 'warning', duration); }
};

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
}

// Auth check on protected pages
function requireAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return false;
    }
    return true;
}

// API versioning
const API_BASE = '/api/v1';

// API helper
async function api(path, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (options.body && typeof options.body === 'object') {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }

    // Prepend API base if path starts with /
    const url = path.startsWith('/') ? API_BASE + path : path;
    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return null;
    }

    return res;
}
