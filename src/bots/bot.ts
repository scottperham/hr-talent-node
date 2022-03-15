import { ConversationState, TeamsActivityHandler, TurnContext, UserState, Activity, SigninStateVerificationQuery, MessageFactory, CardFactory, AdaptiveCardInvokeResponse, AdaptiveCardInvokeValue, MessagingExtensionQuery, MessagingExtensionResponse, MessagingExtensionAction, MessagingExtensionActionResponse } from "botbuilder";
import { randomUUID } from "crypto";
import { CommandBase } from "../commands/commandBase";
import { HelpCommand } from "../commands/helpCommand";
import { PositionDetailsCommand } from "../commands/positionDetailsCommand";
import { CandidateDetailsCommand } from "../commands/candidateDetailsCommand";
import { TopCandidatesCommand } from "../commands/topCandidatesCommand";
import { ServiceContainer } from "../services/data/serviceContainer";
import { InvokeActivityHandler } from "../services/invokeActivityHandler";
import { TokenProvider } from "../services/tokenProvider";
export class TeamsTalentMgmtBot extends TeamsActivityHandler {

    userState: UserState;
    conversationState: ConversationState;
    invokeHandler: InvokeActivityHandler;
    commands: {command: CommandBase, requireAuth: boolean}[];
    services: ServiceContainer;
    tokenProvider: TokenProvider;

    constructor(
        userState: UserState, 
        conversationState: ConversationState,
        services: ServiceContainer) {
        super();

        this.userState = userState;
        this.conversationState = conversationState;
        this.services = services;

        this.tokenProvider = new TokenProvider(userState);

        this.invokeHandler = new InvokeActivityHandler(this.tokenProvider, services);

        this.commands = [
            {command: new HelpCommand(services), requireAuth: false },
            {command: new CandidateDetailsCommand(services), requireAuth: true},
            {command: new PositionDetailsCommand(services), requireAuth: true},
            {command: new TopCandidatesCommand(services), requireAuth: true}
        ]

        this.onMessage(async (context, next): Promise<void> => {

            if (this.hasFiles(context.activity)) {
                // TODO: handle files
            }

            if (context.activity.text) {
                await this.handleTextMessage(context, context.activity.text);
            }

            await next();
        });
    }

    async run(context: TurnContext): Promise<void> {
        await super.run(context);

        await this.userState.saveChanges(context);
        await this.conversationState.saveChanges(context);
    }

    private async handleTextMessage(context: TurnContext, text: string) : Promise<void> {
        const commandText = context.activity.text.trim().toLowerCase()

        const command = this.commands.find(x => commandText.startsWith(x.command.id))

        if (command) {
            if (command.requireAuth) {

                const token = await this.tokenProvider.getToken(context);

                if (!token) {
                    await this.sendOAuthCard(context);
                    return;
                }
            }
            
            await command.command.execute(context);
        }
        else {
            await context.sendActivity("Sorry, not sure...");
        }
    }

    private async sendOAuthCard(context: TurnContext) : Promise<void> {
        const activity = MessageFactory.attachment({
            contentType: CardFactory.contentTypes.oauthCard,
            content: {
                tokenExchangeResource: {
                    id: randomUUID()
                },
                connectionName: process.env.OAuthConnectionName
            }
        });

        await context.sendActivity(activity);
    }

    protected async handleTeamsMessagingExtensionSubmitAction(context: TurnContext, action: MessagingExtensionAction): Promise<MessagingExtensionActionResponse> {
        return await this.invokeHandler.handleMessagingExtensionSubmitAction(action);
    }

    protected async handleTeamsMessagingExtensionFetchTask(context: TurnContext, action: MessagingExtensionAction): Promise<MessagingExtensionActionResponse> {
        return await this.invokeHandler.handleMessageExtensionFetchTask(action);
    }

    protected async handleTeamsMessagingExtensionQuery(context: TurnContext, query: MessagingExtensionQuery): Promise<MessagingExtensionResponse> {
        return await this.invokeHandler.handleMessagingExtensionQuery(query, context.activity.channelData.source.name);
    }

    protected async onAdaptiveCardInvoke(context: TurnContext, invokeValue: AdaptiveCardInvokeValue): Promise<AdaptiveCardInvokeResponse> {
        
        switch(invokeValue.action.verb) {
            case "LeaveComment":
                return await this.invokeHandler.handleLeaveComment(invokeValue.action.data, context.activity.from.name);
            case "ScheduleInterview":
                return await this.invokeHandler.handleScheduleInterview(invokeValue.action.data);
        }

        return {
            statusCode: 400,
            type: "",
            value: {}
        };
    }

    protected async handleTeamsSigninTokenExchange(context: TurnContext, query: SigninStateVerificationQuery): Promise<void> {
        await this.invokeHandler.handleSignInVerifyState(context);
    }

    private hasFiles(activity: Activity) : boolean {
        return activity.attachments?.some(x => x.contentType == "application/vnd.microsoft.teams.file.download.info") || false;
    }
}