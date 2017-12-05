import {
    USER_CHECK_SUCCESS,
    USER_LOGIN_SUCCESS,
} from '../../actions/authActions';

const initialState = {
    user: null,
    permissions: {},
};

const getPermissionsKey = (route, resource, routeParams) => {
    let params = '';

    if (routeParams) {
        const keys = Object.keys(routeParams);

        if (keys.length > 0) {
            params = keys.reduce(
                (acc, key, index) =>
                    `${acc}${routeParams[key]}${index < keys.lenth ? '/' : ''}`,
                '/'
            );
        }
    }

    if (resource) {
        return `${resource}/${route}${params}`;
    }

    return `${route}${params}`;
};

export default (previousState = initialState, action) => {
    switch (action.type) {
        case USER_CHECK_SUCCESS: {
            const { resource, route } = action.meta;
            const key = getPermissionsKey(
                route,
                resource,
                action.meta ? action.meta.routeParams : undefined
            );
            return {
                ...previousState,
                permissions: {
                    ...previousState.permissions,
                    [key]: action.payload,
                },
            };
        }
        case USER_LOGIN_SUCCESS:
            return {
                ...previousState,
                user: action.payload,
            };
        default:
            return previousState;
    }
};

export const getPermissions = (state, { route, resource, params }) => {
    const key = getPermissionsKey(route, resource, params);
    if (state && state.admin && state.admin.auth) {
        return state.admin.auth.permissions[key];
    }

    return null;
};
