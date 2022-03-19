import { CloudAdapter, MessageFactory } from 'botbuilder';
import {Express, Response} from 'express';
import { InstallBotResult } from './services/data/graphApiService';
import { NotificationResult } from './services/data/notificationService';
import { ServiceContainer } from './services/data/serviceContainer';

interface UserTenantRequest {
    id: string
    tenantId: string
}

interface NotifyRequest extends UserTenantRequest {
    text: string
}

const configure : (app : Express, services: ServiceContainer, adapter: CloudAdapter) => void = (app, services) => {

    app.post('/api/notify', async (req, res) => {
        const body: NotifyRequest = req.body;

        const activity = MessageFactory.text(body.text);

        try{
            const result = await services.notificationService.sendProactiveNotification(body.id, body.tenantId, activity);

            if (result == NotificationResult.AliasNotFound) {
                // Alias not found
                return res.status(404).send(`Alias '${body.id}' was not found in the tenant '${body.tenantId}'`);
            }

            if (result == NotificationResult.BotNotInstalled) {
                // Precondition failed - app not installed!
                return res.status(412).send(`The bot has not been installed for '${body.id}' in the tenant '${body.tenantId}'`);
            }
            
        }
        catch (err: any) {
            handleError(err, res);
        }

        return res.sendStatus(202);
    });

    app.post('/api/installbot', async (req, res) => {
        const body: UserTenantRequest = req.body;

        try {
            const result = await services.graphApiService.installBotForUser(body.id, body.tenantId);

            switch (result) {
                case InstallBotResult.MissingToken:
                    return res.sendStatus(403);
                case InstallBotResult.AliasNotFound:
                    return res.sendStatus(404);
                case InstallBotResult.Success:
                    return res.sendStatus(200);
            }
        }
        catch (err: any) {
            handleError(err, res);
        }
    });

};

const handleError : (err: any, res: Response) => void = (err, res) => {
    if (err.hasOwnProperty("statusCode")) {
        res.status(<number>err["statusCode"]);
    }
    else {
        res.status(500);
    }

    if (err.hasOwnProperty("body")) {
        const body = JSON.parse(err["body"]);
        if (body.hasOwnProperty("message")) {
            res.send(body["message"]);
        }
        else{
            res.send(err["body"]);
        }
    }
    else {
        res.send(err);
    }
}

export default configure;