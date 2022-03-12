import { ConversationState, TeamsActivityHandler, TurnContext, UserState, ActivityEx, FileDownloadInfo, Activity, SigninStateVerificationQuery, MessageFactory, CardFactory } from "botbuilder";
import { randomUUID } from "crypto";
import { CommandBase } from "../commands/commandBase";
import { CandidateDetailsCommand, HelpCommand } from "../commands/helpCommand";
import { CandidateService, InterviewService, LocationService, PositionService, RecruiterService, ServiceContainer, TemplatingService } from "../services/data/candidateService";
import { InvokeActivityHandler } from "../services/invokeActivityHandler";
import { TokenProvider } from "../services/tokenProvider";
export class TeamsTalentMgmtBot extends TeamsActivityHandler {

    userState: UserState;
    conversationState: ConversationState;
    invokeHandler: InvokeActivityHandler;
    commands: {command: CommandBase, requireAuth: boolean}[];

    constructor(
        userState: UserState, 
        conversationState: ConversationState,
        services: ServiceContainer) {
        super();

        this.userState = userState;
        this.conversationState = conversationState;

        const tokenProvider = new TokenProvider(userState);

        this.invokeHandler = new InvokeActivityHandler(tokenProvider, conversationState);

        this.commands = [
            {command: new HelpCommand(), requireAuth: true },
            {command: new CandidateDetailsCommand(services), requireAuth: false}
        ]

        this.onMessage(async (context, next): Promise<void> => {

            if (this.hasFiles(context.activity)) {
                // TODO: handle files
            }

            const commandText = context.activity.text.trim().toLowerCase()

            const command = this.commands.find(x => commandText.startsWith(x.command.id))

            if (command) {
                if (command.requireAuth) {

                    const token = await tokenProvider.getToken(context);

                    if (!token) {

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
                        await next();
                        return;
                    }
                }
                
                await command.command.Execute(context);
            }
            else {
                await context.sendActivity("Sorry, not sure...");
            }

            await next();
        })
    }

    async run(context: TurnContext): Promise<void> {
        await super.run(context);

        await this.userState.saveChanges(context);
        await this.conversationState.saveChanges(context);
    }

    protected async handleTeamsSigninTokenExchange(context: TurnContext, query: SigninStateVerificationQuery): Promise<void> {
        await this.invokeHandler.handleSignInVerifyState(context);
    }

    private hasFiles(activity: Activity) : boolean {
        return activity.attachments?.some(x => x.contentType == "application/vnd.microsoft.teams.file.download.info") || false;
    }
}