import * as path from 'path';
import * as dotenv from 'dotenv';
import { CloudAdapter, ConfigurationServiceClientCredentialFactory, ConfigurationBotFrameworkAuthentication, MemoryStorage, ConversationState, UserState, ShowTypingMiddleware } from 'botbuilder';
import { TeamsTalentMgmtBot } from './bots/bot';
import { ServiceContainer } from "./services/data/serviceContainer";
import { ClientApiService } from './services/clientApiService';
import express from 'express';

const env_file = path.join(__dirname, "..", ".env");
dotenv.config({path: env_file});

const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: process.env.MicrosoftAppId,
    MicrosoftAppPassword: process.env.MicrosoftAppPassword,
    MicrosoftAppTenantId: process.env.MicrosoftDirectoryId
});

const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(undefined, credentialsFactory);

const adapter = new CloudAdapter(botFrameworkAuthentication);
adapter.use(new ShowTypingMiddleware());
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
const staticViewsPath = path.join(__dirname, "..", "src\\StaticViews");

const services = new ServiceContainer();
services.loadData(sampleDataPath);
services.loadTemplates(templatesPath);

const bot = new TeamsTalentMgmtBot(
    userState, 
    conversationState, 
    services);

const clientApiService = new ClientApiService(services);

const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
});

app.use(express.json());
app.use("/StaticViews", express.static(staticViewsPath));

const port = process.env.port || process.env.PORT || 3978;

app.listen(port, () => {
    console.log(`\nListening to ${ port }`);
});

app.post('/api/messages', async (req, res) => {
    await adapter.process(req, res, context => bot.run(context));
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
