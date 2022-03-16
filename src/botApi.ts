import { Express } from "express";
import { botFrameworkAuth } from "./auth";
import { ServiceContainer } from "./services/data/serviceContainer";
import { CloudAdapter, ConfigurationServiceClientCredentialFactory, ConfigurationBotFrameworkAuthentication, MemoryStorage, UserState, ShowTypingMiddleware } from 'botbuilder';
import { TeamsTalentMgmtBot } from "./bots/bot";

const configure : (app : Express, services: ServiceContainer) => void = (app, services) => {
    
    const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
        MicrosoftAppId: process.env.MicrosoftAppId,
        MicrosoftAppPassword: process.env.MicrosoftAppPassword,
        MicrosoftAppTenantId: process.env.MicrosoftDirectoryId
    });
    
    const memoryStorage = new MemoryStorage();
    const userState = new UserState(memoryStorage);
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
        
    const bot = new TeamsTalentMgmtBot(userState, services);
    
    app.use("/api/messages", botFrameworkAuth);

    app.post('/api/messages', async (req, res) => {
        await adapter.process(req, res, context => bot.run(context));
    });
};

export default configure;