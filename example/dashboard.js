import React from 'react';
import { Card, CardText } from 'material-ui/Card';
import { ViewTitle } from 'admin-on-rest';

export const Dashboard = ({ permissions }) => (
    <Card>
        {permissions === 'admin' ? (
            <ViewTitle title="Admin Dashboard" />
        ) : permissions === 'user' ? (
            <ViewTitle title="User Dashboard" />
        ) : (
            <ViewTitle title="Dashboard" />
        )}
        <CardText>Lorem ipsum sic dolor amet...</CardText>
    </Card>
);
