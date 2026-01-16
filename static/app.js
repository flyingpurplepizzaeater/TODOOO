// Global utilities
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

    const res = await fetch(path, { ...options, headers });

    if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return null;
    }

    return res;
}
