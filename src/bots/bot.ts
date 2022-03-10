import { ConversationState, TeamsActivityHandler, TurnContext, UserState, ActivityEx, FileDownloadInfo, Activity, SigninStateVerificationQuery } from "botbuilder";
import { DialogState, runDialog } from "botbuilder-dialogs";
import { MainDialog } from "../dialogs/mainDialog";
import { InvokeActivityHandler } from "../services/invokeActivityHandler";
import { TokenProvider } from "../services/tokenProvider";
export class TeamsTalentMgmtBot extends TeamsActivityHandler {

    userState: UserState;
    conversationState: ConversationState;
    mainDialog: MainDialog;
    invokeHandler: InvokeActivityHandler;

    constructor(userState: UserState, conversationState: ConversationState) {
        super();

        this.userState = userState;
        this.conversationState = conversationState;

        const tokenProvider = new TokenProvider(userState);

        this.mainDialog = new MainDialog(tokenProvider);
        this.invokeHandler = new InvokeActivityHandler(tokenProvider, conversationState);

        this.onDialog(async (context: TurnContext, next) => {
            await this.userState.saveChanges(context);
            await this.conversationState.saveChanges(context);
            await next();
        })

        this.onMessage(async (context: TurnContext, next): Promise<void> => {

            if (this.hasFiles(context.activity)) {
                // TODO: handle files
            }
            
            const stateAccessor = this.conversationState.createProperty<DialogState>("TeamsTalentMgmtBot");
            await runDialog(this.mainDialog, context, stateAccessor);

            await next();
        })
    }

    protected async handleTeamsSigninTokenExchange(context: TurnContext, query: SigninStateVerificationQuery): Promise<void> {
        await this.invokeHandler.handleSignInVerifyState(context);
    }

    private hasFiles(activity: Activity) : boolean {
        return activity.attachments?.some(x => x.contentType == "application/vnd.microsoft.teams.file.download.info") || false;
    }
}