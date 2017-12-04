import React from 'react';
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
