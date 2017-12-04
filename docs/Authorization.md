---
layout: default
title: "Authorization"
---

# Authorization

Some applications may require to determine what level of access a particular authenticated user should have to secured resources. Since there are many different possible strategies (single role, multiple roles or rights, etc.), admin-on-rest simply provides hooks to execute your own authorization code.

By default, an admin-on-rest app doesn't require authorization. However, if needed, it will rely on the `authClient` introduced in the [Authentication](./Authentication.html) section.

## Configuring the Auth Client

A call to the `authClient` with the `AUTH_CHECK` type will be made each time a route requires to check the user's permissions.

Following is an example where the `authClient` stores the user's role upon authentication, and returns it when called for a permissions check:

```jsx
// in src/authClient.js
import { AUTH_LOGIN, AUTH_LOGOUT, AUTH_ERROR, AUTH_CHECK } from 'admin-on-rest';
import decodeJwt from 'jwt-decode';

export default (type, params) => {
    if (type === AUTH_LOGIN) {
        const { username, password } = params;
        const request = new Request('https://mydomain.com/authenticate', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            headers: new Headers({ 'Content-Type': 'application/json' }),
        })
        return fetch(request)
            .then(response => {
                if (response.status < 200 || response.status >= 300) {
                    throw new Error(response.statusText);
                }
                return response.json();
            })
            .then(({ token }) => {
                const decodedToken = decodeJwt(token);
                localStorage.setItem('token', token);
                localStorage.setItem('role', decodedToken.role);
            });
    }
    if (type === AUTH_LOGOUT) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        return Promise.resolve();
    }
    if (type === AUTH_ERROR) {
        // ...
    }
    if (type === AUTH_CHECK) {
        // You might want to retrive permissions from a third party service
        // route and resource will be provided when applicable. See the next
        // sections for more information.
        const { resource, route } = payload;
        const isAuthenticated = localStorage.getItem('token');

        if (!isAuthenticated) {
            return Promise.reject();
        }

        const role = localStorage.getItem('role');
        return  Promise.resolve(role);
    }

    return Promise.reject('Unkown method');
};
```

## Restricting Access To Resources or Views

It's possible to restrict access to resources or their views inside the `Admin` component. To do so, you must specify a function as the `Admin` only child. This function will be called with the permissions returned by the `authClient`.

The `Admin` component will call the `authClient` with the `AUTH_CHECK` type and its payload will be empty (no `resource` nor `route` property).

{% raw %}
```jsx
<Admin
    restClient={restClient}
    authClient={authClient}
>
    {permissions => [
        // Restrict access to the edit and remove views to admin only
        <Resource
            name="customers"
            list={VisitorList}
            edit={permissions === 'admin' ? VisitorEdit : null}
            remove={permissions === 'admin' ? VisitorDelete : null}
            icon={VisitorIcon}
        />,
        // Only include the categories resource for admin users
        permissions === 'admin'
            ? <Resource name="categories" list={CategoryList} edit={CategoryEdit} remove={Delete} icon={CategoryIcon} />
            : null,
    ]}
</Admin>
```
{% endraw %}

Note that the function returns an array of React elements. This is required to avoid having to wrap them in a container element which would prevent the `Admin` from working.

**Tip** Even if that's possible, be careful when completely excluding a resource (like with the `categories` resource in this example) as it will prevent you to reference them in the other resource views, too. In order to keep reference related fields and inputs working (such as `ReferenceField`), include the resource without specifying any component:

{% raw %}
```jsx
<Admin
    restClient={restClient}
    authClient={authClient}
>
    {permissions => [
        // Restrict access to the edit and remove views to admin only
        <Resource
            name="customers"
            list={VisitorList}
            edit={permissions === 'admin' ? VisitorEdit : null}
            remove={permissions === 'admin' ? VisitorDelete : null}
            icon={VisitorIcon}
        />,
        // Only include the categories resource for admin users
        permissions === 'admin'
            ? <Resource name="categories" list={CategoryList} edit={CategoryEdit} remove={Delete} icon={CategoryIcon} />
            : <Resource name="categories" />,
    ]}
</Admin>
```
{% endraw %}

## Restricting Access To Fields And Inputs

You might want to display some fields, inputs or filters only to users with specific permissions. The permissions will be retrieved for the current resource and route. Hence, the `authClient` will be called with the `AUTH_CHECK` type and the payload will contain the `resource`, `route` properties and `routeParams` properties. The `routeParams` property will contains any parameters declared for the route, such as the resource `id` for the `edit` route.

The possible values for the `route` property are `list`, `create`, `show`, `edit` and `delete`.

Here's an example for a `Create` view with a `SimpleForm` and a custom `Toolbar`:

{% raw %}
```jsx
const UserCreateToolbar = ({ permissions, ...props }) =>
    <Toolbar {...props}>
        <SaveButton
            label="user.action.save_and_show"
            redirect="show"
            submitOnEnter={true}
        />
        {permissions === 'admin' &&
            <SaveButton
                label="user.action.save_and_add"
                redirect={false}
                submitOnEnter={false}
                raised={false}
            />}
    </Toolbar>;

export const UserCreate = ({ permissions, ...props }) =>
    <Create {...props}>
        <SimpleForm
            toolbar={<UserCreateToolbar permissions={permissions} />}
            defaultValue={{ role: 'user' }}
        >
            <TextInput source="name" validate={[required]} />
            {permissions === 'admin' &&
                <TextInput source="role" validate={[required]} />}
        </SimpleForm>
    </Create>;
```
{% endraw %}

**Tip**: Note how we passed the `permissions` down to our custom toolbar component.

This also works inside an `Edition` view with a `TabbedForm`, and you can hide a `FormTab` completely:

{% raw %}
```jsx
export const UserEdit = ({ permissions, ...props }) =>
    <Edit title={<UserTitle />} {...props}>
        <TabbedForm defaultValue={{ role: 'user' }}>
            <FormTab label="user.form.summary">
                {permissions === 'admin' && <DisabledInput source="id" />}
                <TextInput source="name" validate={required} />
            </FormTab>
            {permissions === 'admin' &&
                <FormTab label="user.form.security">
                    <TextInput source="role" validate={required} />
                </FormTab>}
        </TabbedForm>
    </Edit>;
```
{% endraw %}

What about the `List` view, the `DataGrid`, `SimpleList` and `Filter` components? It works there, too.

{% raw %}
```jsx
const UserFilter = ({ permissions, ...props }) =>
    <Filter {...props}>
        <TextInput
            key="user.list.search"
            label="user.list.search"
            source="q"
            alwaysOn
        />
        <TextInput key="name" source="name" />
        {permissions === 'admin' ? <TextInput source="role" /> : null}
    </Filter>;

export const UserList = ({ permissions, ...props }) =>
    <List
        {...props}
        filters={<UserFilter permissions={permissions} />}
        sort={{ field: 'name', order: 'ASC' }}
    >
        <Responsive
            small={
                <SimpleList
                    primaryText={record => record.name}
                    secondaryText={record =>
                        permissions === 'admin' ? record.role : null}
                />
            }
            medium={
                <Datagrid>
                    <TextField source="id" />
                    <TextField source="name" />
                    {permissions === 'admin' && <TextField source="role" />}
                    {permissions === 'admin' && <EditButton />}
                    <ShowButton />
                </Datagrid>
            }
        />
    </List>;
```
{% endraw %}

**Tip**: Note how we passed the `permissions` down to our custom filter component.

## Checking permissions inside the dashboard component

The [`dashboard`](./Admin.md#dashboard) component will also receive the permissions in its props:

```jsx
// in src/Dashboard.js
import React from 'react';
import { Card, CardText } from 'material-ui/Card';
import { ViewTitle } from 'admin-on-rest/lib/mui';
import { SensitiveData } from './SensitiveData';

export default ({ permissions }) => (
    <Card>
        <ViewTitle title="Dashboard" />
        <CardText>Lorem ipsum sic dolor amet...</CardText>
        {permissions === 'admin' ? <SensitiveData /> : null}
    </Card>
);
```

## Checking permissions inside the custom routes

If you provided [`customRoutes`](./Admin.md#customroutes) and want to access permissions in some of them, you can use the `Restricted` component. Let's review the example from [Restricting Access To A Custom Page](Authentication.md#restricting-access-to-a-custom-page):

```jsx
// in src/MyPage.js
import { withRouter } from 'react-router-dom';
import { Restricted } from 'admin-on-rest';

// The permissions prop will be provided by the Restrited component
const MyPage = ({ permissions }) => (
    <div>
        <p>Some content</p>
        {permissions === 'admin' ? <p>Some sensitive content</p> : null}
    </div>
);

const MyProtectedPage = ({ location }) => {
    // You can provide whatever you need here. This object will be the
    // payload received by the authClient
    const authParams = { route: location.pathname };

    return (
        <Restricted authParams={authParams} location={location}>
            <MyPage />
        </Restricted>
    );
};

export default withRouter(MyProtectedPage);
```

## Restricting access to content in custom menu

What if you want to check the permissions inside a [custom menu](./Admin.html#menu) ? Admin-on-rest provides two components for that: `WithPermission` and `SwitchPermissions`.

### WithPermission

The `WithPermission` component will only display its content if the user has the required permissions. Let's see an example with a custom menu where a custom page link should only be presented to admins:

{% raw %}
```jsx
// in src/Menu.js
import React from 'react';
import { MenuItemLink, WithPermission } from 'admin-on-rest';

export default ({ onMenuTap, logout }) => (
    <div>
        <MenuItemLink to="/posts" primaryText="Posts" onClick={onMenuTap} />
        <MenuItemLink to="/comments" primaryText="Comments" onClick={onMenuTap} />
        <WithPermission value="admin">
            <MenuItemLink to="/custom-route" primaryText="Miscellaneous" onClick={onMenuTap} />
        </WithPermission>
        {logout}
    </div>
);
```
{% endraw %}

The `WithPermission` component requires either a `value` with the permissions to check (could be a role, an array of roles, etc) or a `resolve` function.

An additional `exact` prop may be specified depending on your requirements. It determines whether the user must have **all** the required permissions or only some. If `false`, the default, we'll only check if the user has at least one of the required permissions.

You may bypass the default logic by specifying a function as the `resolve` prop. This function may return `true` or `false` directly or a promise resolving to either `true` or `false`. It will be called with an object having the following properties:

- `permissions`: the result of the `authClient` call.
- `value`: the value of the `value` prop if specified
- `exact`: the value of the `exact` prop if specified

An optional `loading` prop may be specified on the `WithPermission` component to pass a component to display while checking for permissions. It defaults to `null`.

**Tip**: Do not use the `WithPermission` component inside the others admin-on-rest components. It is only meant to be used in custom pages or components.

### SwitchPermissions

The `SwitchPermissions` component will display one of its `Permission` children depending on the permissions returned by the `authClient`. It accepts two optional props:

- `loading`: A component to display while checking for permissions. Defaults to `null`.
- `notFound`: A component to display when no match was found while checking the permissions. Default to `null`.

The `Permission` component requires either a `value` with the permissions to check (could be a role, an array of roles, etc) or a `resolve` function.

An additional `exact` prop may be specified depending on your requirements. It determines whether the user must have **all** the required permissions or only some. If `false`, the default, we'll only check if the user has at least one of the required permissions.

You may bypass the default logic by specifying a function as the `resolve` prop. This function may return `true` or `false` directly or a promise resolving to either `true` or `false`. It will be called with an object having the following properties:

- `permissions`: the result of the `authClient` call.
- `value`: the value of the `value` prop if specified
- `exact`: the value of the `exact` prop if specified

If multiple `Permission` match, only the first one will be displayed.

Here's an example inside a `DashBoard`:

```jsx
// in src/Dashboard.js
import React from 'react';
import BenefitsSummary from './BenefitsSummary';
import BenefitsDetailsWithSensitiveData from './BenefitsDetailsWithSensitiveData';
import { ViewTitle } from 'admin-on-rest/lib/mui';

export default () => (
    <Card>
        <ViewTitle title="Dashboard" />

        <SwitchPermissions>
            <Permission value="associate">
                <BenefitsSummary />
            </Permission>
            <Permission value="boss">
                <BenefitsDetailsWithSensitiveData />
            </Permission>
        </SwitchPermissions>
    </Card>
);
```

**Tip**: Do not use the `SwitchPermissions` component inside the others admin-on-rest components. It is only meant to be used in custom pages or components.

