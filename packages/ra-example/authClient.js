import { AUTH_LOGIN, AUTH_LOGOUT, AUTH_ERROR, AUTH_CHECK } from 'react-admin'; // eslint-disable-line import/no-unresolved

// Authenticatd by default
export default (type, params) => {
    if (type === AUTH_LOGIN) {
        const { username, password } = params;
        if (username === 'login' && password === 'password') {
            localStorage.removeItem('not_authenticated');
            localStorage.removeItem('role');
            return Promise.resolve({ username });
        }
        if (username === 'user' && password === 'password') {
            localStorage.setItem('role', 'user');
            localStorage.removeItem('not_authenticated');
            return Promise.resolve({ username });
        }
        if (username === 'admin' && password === 'password') {
            localStorage.setItem('role', 'admin');
            localStorage.removeItem('not_authenticated');
            return Promise.resolve({ username });
        }
        localStorage.setItem('not_authenticated', true);
        return Promise.reject();
    }
    if (type === AUTH_LOGOUT) {
        localStorage.setItem('not_authenticated', true);
        localStorage.removeItem('role');
        return Promise.resolve();
    }
    if (type === AUTH_ERROR) {
        const { status } = params;
        return status === 401 || status === 403
            ? Promise.reject()
            : Promise.resolve();
    }
    if (type === AUTH_CHECK) {
        const not_authenticated = localStorage.getItem('not_authenticated');

        if (not_authenticated) {
            return Promise.reject();
        }

        const role = localStorage.getItem('role');
        return Promise.resolve(role);
    }

    return Promise.reject('Unknown method');
};
