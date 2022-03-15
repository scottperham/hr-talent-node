import * as path from 'path';
import * as dotenv from 'dotenv';
import * as restify from 'restify';
import { CloudAdapter, ConfigurationServiceClientCredentialFactory, ConfigurationBotFrameworkAuthentication, MemoryStorage, ConversationState, UserState } from 'botbuilder';
import { TeamsTalentMgmtBot } from './bots/bot';
import { ServiceContainer } from "./services/data/ServiceContainer";
import { ClientApiService } from './services/clientApiService';

const env_file = path.join(__dirname, "..", ".env");
dotenv.config({path: env_file});

const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: process.env.MicrosoftAppId,
    MicrosoftAppPassword: process.env.MicrosoftAppPassword,
    MicrosoftAppTenantId: process.env.MicrosoftDirectoryId
});

const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(undefined, credentialsFactory);

const adapter = new CloudAdapter(botFrameworkAuthentication);

adapter.onTurnError = async (context, error) => {
    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
}

const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

const sampleDataPath = path.join(__dirname, "..", "src\\sampleData");
const templatesPath = path.join(__dirname, "..", "src\\templates");

const services = new ServiceContainer();
services.loadData(sampleDataPath);
services.loadTemplates(templatesPath);

const bot = new TeamsTalentMgmtBot(
    userState, 
    conversationState, 
    services);

const clientApiService = new ClientApiService(services);

const server = restify.createServer();
server.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
});
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.queryParser());

server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${ server.name } listening to ${ server.url }`);
});

server.post('/api/messages', async (req, res, next) => {
    await adapter.process(req, res, context => bot.run(context));
    return next();
});

server.get('/api/app', (req, res, next) => {
    res.send(200, {
        appId: process.env.TeamsAppId,
        botId: process.env.MicrosoftAppId
    });
    return next();
});

server.get('/api/candidates/:id', (req, res, next) => {
    const candiate = clientApiService.getCandidate(parseInt(req.params.id as string));
    if (!candiate) {
        res.send(404);
    }
    else {
        res.send(200, candiate);
    }

    return next();
});

server.get('/api/positions/open', (req, res, next) => {
    res.send(200, services.positionService.getOpenPositions());
    return next();
});

server.get('/api/recruiters/:alias/positions', (req, res, next) => {
    res.send(200, services.positionService.getOpenPositions(/*req.params.alias*/));
    return next();
});

server.get("/StaticViews/*", (req, res, next) => {
    return restify.plugins.serveStatic({
        directory: path.join(__dirname, "..", "src")
    })(req, res, next)
});
