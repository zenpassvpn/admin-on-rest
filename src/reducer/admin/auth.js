import {
    USER_CHECK_SUCCESS,
    USER_LOGIN_SUCCESS,
} from '../../actions/authActions';

const initialState = {
    user: null,
    permissions: {},
};

const getPermissionsKey = (route, resource) => {
    if (resource) {
        return `${resource}/${route}`;
    }

    return route;
};

export default (previousState = initialState, action) => {
    switch (action.type) {
        case USER_CHECK_SUCCESS: {
            const { resource, route, permissions } = action.payload;
            const key = getPermissionsKey(route, resource);

            return {
                ...previousState,
                permissions: {
                    ...previousState.permissions,
                    [key]: permissions,
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

export const getPermissions = (state, { route, resource }) => {
    const key = getPermissionsKey(route, resource);
    return state.admin.auth.permissions[key];
};
