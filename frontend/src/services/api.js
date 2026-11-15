const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'token';

export class ApiError extends Error {
    constructor(message, status, fields = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.fields = fields;
    }
}

export function getAuthToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
    const headers = new Headers(options.headers);
    const token = getAuthToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    let body = options.body;
    if (body !== undefined && !(body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
        body = JSON.stringify(body);
    }

    let response;
    try {
        response = await fetch(`${API_URL}${path}`, { ...options, headers, body });
    } catch {
        throw new ApiError('Não foi possível conectar ao backend. Verifique se o servidor está em execução.', 0);
    }
    if (response.status === 204) return null;

    let data;
    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new ApiError(
            data.erro || 'Não foi possível concluir a solicitação.',
            response.status,
            data.campos || {}
        );
    }

    return data;
}

export const api = {
    get: (path, options) => request(path, options),
    post: (path, body) => request(path, { method: 'POST', body }),
    put: (path, body) => request(path, { method: 'PUT', body }),
    delete: (path) => request(path, { method: 'DELETE' })
};
