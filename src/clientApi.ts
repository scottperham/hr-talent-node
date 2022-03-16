import {Express} from 'express';
import { aadAppAuth } from './auth';
import { ClientApiService } from './services/clientApiService';
import { ServiceContainer } from './services/data/serviceContainer';

const configure : (app : Express, services: ServiceContainer) => void = (app, services) => {

    const clientApiService = new ClientApiService(services);

    app.use("/api/*", (req, res, next) => {
        if (req.baseUrl == "/api/messages") {
            next();
            return;
        }
        aadAppAuth(req, res, next);
    });

    app.get('/api/app', (req, res) => {
        res.send({
            appId: process.env.TeamsAppId,
            botId: process.env.MicrosoftAppId
        });
    });
    
    app.get('/api/candidates/:id', async (req, res) => {
        const candiate = await clientApiService.getCandidate(parseInt(req.params.id));
        if (!candiate) {
            res.status(404);
        }
        else {
            res.send(candiate);
        }
    });
    
    app.get('/api/positions', async (req, res) => {
        res.send(await services.positionService.getAll());
    });
    
    app.get('/api/positions/:id', async (req, res) => {
        const position = await services.positionService.getById(parseInt(req.params.id), true);
        if (!position) {
            res.status(404);
            return;
        }
        for (let i = 0; i < position?.candidates.length; i++) {
            await services.candidateService.expand(position.candidates[i]);
        }
        res.send(position);
    });
    
    app.get('/api/positions/open', async (req, res) => {
        res.send(await services.positionService.getOpenPositions());
    });
    
    app.get('/api/recruiters/:alias/positions', async (req, res) => {
        res.send(await services.positionService.getOpenPositions(/*req.params.alias*/));
    });

};

export default configure;