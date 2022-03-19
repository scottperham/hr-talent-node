import { ConversationState, TeamsActivityHandler, TurnContext, UserState, Activity, SigninStateVerificationQuery, MessageFactory, CardFactory, AdaptiveCardInvokeResponse, AdaptiveCardInvokeValue, MessagingExtensionQuery, MessagingExtensionResponse, MessagingExtensionAction, MessagingExtensionActionResponse, FileConsentCardResponse, TeamInfo, TeamsChannelAccount, StatePropertyAccessor } from "botbuilder";
import { CommandBase } from "../commands/commandBase";
import { HelpCommand } from "../commands/helpCommand";
import { PositionDetailsCommand } from "../commands/positionDetailsCommand";
import { CandidateDetailsCommand } from "../commands/candidateDetailsCommand";
import { TopCandidatesCommand } from "../commands/topCandidatesCommand";
import { ServiceContainer } from "../services/data/serviceContainer";
import { InvokeActivityHandler } from "../services/invokeActivityHandler";
import { TokenProvider } from "../services/tokenProvider";
import { NewPositionCommand } from "../commands/newPositionCommand";
import { CandidateSummaryCommand } from "../commands/candidateSummaryCommand";
import { SignOutCommand } from "../commands/signOutCommand";
import { SignInCommand } from "../commands/signInCommand";
export class TeamsTalentMgmtBot extends TeamsActivityHandler {

    userState: UserState;
    invokeHandler: InvokeActivityHandler;
    commands: {command: CommandBase, requireAuth: boolean}[];
    services: ServiceContainer;
    tokenProvider: TokenProvider;
    welcomeMessageState: StatePropertyAccessor<boolean>;

    constructor(userState: UserState, services: ServiceContainer) {
        super();

        this.userState = userState;
        this.services = services;

        this.welcomeMessageState = userState.createProperty<boolean>("welcomeMessageShown");

        this.tokenProvider = new TokenProvider(userState);

        this.invokeHandler = new InvokeActivityHandler(this.tokenProvider, services);

        this.commands = [
            {command: new HelpCommand(services), requireAuth: false },
            {command: new CandidateDetailsCommand(services), requireAuth: true},
            {command: new PositionDetailsCommand(services), requireAuth: true},
            {command: new TopCandidatesCommand(services), requireAuth: true},
            {command: new NewPositionCommand(services, this.tokenProvider), requireAuth: true},
            {command: new CandidateSummaryCommand(services), requireAuth: true},
            {command: new SignOutCommand(services, this.tokenProvider), requireAuth: false},
            {command: new SignInCommand(services, this.tokenProvider), requireAuth: false}
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

        this.onTeamsMembersAddedEvent(async (membersAdded, teamInfo, context, next) => {
            const m = membersAdded;
            if (context.activity.membersAdded?.every(x => x.id != context.activity.recipient.id)) {
                //Bot was added before
            }
            else if (!context.activity.conversation.isGroup) {
                if (!await this.welcomeMessageState.get(context)) {
                    await context.sendActivity(MessageFactory.attachment(services.templatingService.getWelcomeMessageCard()));
                }
                await this.welcomeMessageState.set(context, true);
            }

            await next();
        });

        this.onInstallationUpdate(async (context, next): Promise<void> => {
            await this.welcomeMessageState.set(context, false);
            await next();
        });
    }

    async run(context: TurnContext): Promise<void> {
        await super.run(context);

        await this.userState.saveChanges(context);
    }

    private async handleTextMessage(context: TurnContext, text: string) : Promise<void> {

        const commandText = text.trim().toLowerCase();
        const commandContainer = this.commands.find(x => commandText.startsWith(x.command.id))

        if (commandContainer) {

            let command = commandContainer.command;

            if (commandContainer.requireAuth) {

                if (!await this.tokenProvider.hasToken(context)) {
                    command = new SignInCommand(this.services, this.tokenProvider);
                }
            }
            
            await command.execute(context);
        }
        else {
            await context.sendActivity("Sorry, not sure...");
        }
    }

    protected async handleTeamsMessagingExtensionSubmitAction(context: TurnContext, action: MessagingExtensionAction): Promise<MessagingExtensionActionResponse> {
        return await this.invokeHandler.handleMessagingExtensionSubmitAction(action);
    }

    protected async handleTeamsMessagingExtensionFetchTask(context: TurnContext, action: MessagingExtensionAction): Promise<MessagingExtensionActionResponse> {
        return await this.invokeHandler.handleMessageExtensionFetchTask(context, action);
    }

    protected async handleTeamsMessagingExtensionQuery(context: TurnContext, query: MessagingExtensionQuery): Promise<MessagingExtensionResponse> {
        return await this.invokeHandler.handleMessagingExtensionQuery(context, query, context.activity.channelData.source.name);
    }

    protected async onAdaptiveCardInvoke(context: TurnContext, invokeValue: AdaptiveCardInvokeValue): Promise<AdaptiveCardInvokeResponse> {
        
        switch(invokeValue.action.verb) {
            case "LeaveComment":
                return await this.invokeHandler.handleLeaveComment(invokeValue.action.data, context.activity.from.name);
            case "ScheduleInterview":
                return await this.invokeHandler.handleScheduleInterview(invokeValue.action.data);
            case "CreatePosition":
                return await this.invokeHandler.handleCreatePosition(invokeValue.action.data);
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

    protected async handleTeamsFileConsentAccept(context: TurnContext, fileConsentCardResponse: FileConsentCardResponse): Promise<void> {
        await this.invokeHandler.handleFileConsent(context, fileConsentCardResponse, true);
    }

    protected async handleTeamsFileConsentDecline(context: TurnContext, fileConsentCardResponse: FileConsentCardResponse): Promise<void> {
        await this.invokeHandler.handleFileConsent(context, fileConsentCardResponse, false);
    }

    private hasFiles(activity: Activity) : boolean {
        return activity.attachments?.some(x => x.contentType == "application/vnd.microsoft.teams.file.download.info") || false;
    }
}