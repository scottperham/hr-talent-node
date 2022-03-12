import * as path from 'path';
import * as dotenv from 'dotenv';
import * as restify from 'restify';
import { CloudAdapter, ConfigurationServiceClientCredentialFactory, ConfigurationBotFrameworkAuthentication, MemoryStorage, ConversationState, UserState } from 'botbuilder';
import { TeamsTalentMgmtBot } from './bots/bot';
import { CandidateService, InterviewService, LocationService, PositionService, RecruiterService, ServiceContainer, TemplatingService } from './services/data/candidateService';

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
const templatePath = path.join(__dirname, "..", "src\\templates");

const candidateService = new CandidateService(); candidateService.load(sampleDataPath);
const interviewService = new InterviewService(); interviewService.load(sampleDataPath);
const locationService = new LocationService(); locationService.load(sampleDataPath);
const positionService = new PositionService(); positionService.load(sampleDataPath);
const recruiterService = new RecruiterService(); recruiterService.load(sampleDataPath);

const templatingService = new TemplatingService(); templatingService.load(templatePath);

const services = new ServiceContainer(candidateService, interviewService, locationService, positionService, recruiterService, templatingService);

const bot = new TeamsTalentMgmtBot(
    userState, 
    conversationState, 
    services);

const server = restify.createServer();
server.use(restify.plugins.bodyParser());

server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${ server.name } listening to ${ server.url }`);
});

server.post('/api/messages', async (req, res) => {
    await adapter.process(req, res, context => bot.run(context));
});
