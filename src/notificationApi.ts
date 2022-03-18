import { CloudAdapter, MessageFactory } from 'botbuilder';
import {Express} from 'express';
import { ServiceContainer } from './services/data/serviceContainer';

interface UserTenantRequest {
    id: string
    tenantId: string
}

interface NotifyRequest extends UserTenantRequest {
    text: string
}

const configure : (app : Express, services: ServiceContainer, adapter: CloudAdapter) => void = (app, services) => {

    // app.post('/api/notify', async (req, res) => {
    //     const body: NotifyRequest = req.body;

    //     const activity = MessageFactory.text(body.text);

    //     await services.notificationService.sendProactiveNotification(body.id, body.tenantId, activity);
    // });

};

export default configure;