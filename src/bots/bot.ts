import { parseBool } from "adaptivecards";
import { ConversationState, TeamsActivityHandler, TurnContext, UserState, ActivityEx, FileDownloadInfo, Activity, SigninStateVerificationQuery, MessageFactory, CardFactory, AdaptiveCardInvokeResponse, AdaptiveCardInvokeValue, InvokeResponse } from "botbuilder";
import { randomUUID } from "crypto";
import { CommandBase } from "../commands/commandBase";
import { CandidateDetailsCommand, HelpCommand } from "../commands/helpCommand";
import { CandidateService } from "../services/data/CandidateService";
import { ServiceContainer } from "../services/data/ServiceContainer";
import { InterviewService } from "../services/data/InterviewService";
import { LocationService } from "../services/data/LocationService";
import { TemplatingService } from "../services/data/TemplatingService";
import { RecruiterService } from "../services/data/RecruiterService";
import { PositionService } from "../services/data/PositionService";
import { Candidate, Recruiter } from "../services/data/dtos";
import { InvokeActivityHandler } from "../services/invokeActivityHandler";
import { TokenProvider } from "../services/tokenProvider";
export class TeamsTalentMgmtBot extends TeamsActivityHandler {

    userState: UserState;
    conversationState: ConversationState;
    invokeHandler: InvokeActivityHandler;
    commands: {command: CommandBase, requireAuth: boolean}[];
    services: ServiceContainer;

    constructor(
        userState: UserState, 
        conversationState: ConversationState,
        services: ServiceContainer) {
        super();

        this.userState = userState;
        this.conversationState = conversationState;
        this.services = services;

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
        });

        // this.oninv(async (context, next): Promise<void> => {

        //     if (!context.activity.value?.commandId) {
        //         return;
        //         await next();
        //     }

        //     console.log(context.activity.value.commandId);
        //     await next();
        // });
    }

    async run(context: TurnContext): Promise<void> {
        await super.run(context);

        await this.userState.saveChanges(context);
        await this.conversationState.saveChanges(context);
    }

    protected onAdaptiveCardInvoke(context: TurnContext, invokeValue: AdaptiveCardInvokeValue): Promise<AdaptiveCardInvokeResponse> {
        
        let candidate: Candidate;

        switch(invokeValue.action.verb) {
            case "LeaveComment":
                candidate = <Candidate>this.services.candidateService.getById(parseInt(<string>invokeValue.action.data.candidateId), true);
                this.services.candidateService.saveComment({
                    authorName: context.activity.from.name,
                    candidateId: candidate.id,
                    text: <string>invokeValue.action.data.comment,
                    id: 0
                });
                return Promise.resolve({
                    type: CardFactory.contentTypes.adaptiveCard,
                    statusCode: 200,
                    value: this.services.templatingService.getCandidateTemplate(candidate, this.services.recruiterService.getAll(), "Comment added")
                });
            case "ScheduleInterview":
                candidate = <Candidate>this.services.candidateService.getById(parseInt(<string>invokeValue.action.data.candidateId), true);
                this.services.interviewService.scheduleInterview(
                    parseInt(<string>invokeValue.action.data.candidateId), 
                    parseInt(<string>invokeValue.action.data.interviewId), 
                    new Date(<string>invokeValue.action.data.interviewDate), 
                    <string>invokeValue.action.data.interviewType, 
                    <boolean>parseBool(<string>invokeValue.action.data.isRemote));

                return Promise.resolve({
                    type: CardFactory.contentTypes.adaptiveCard,
                    statusCode: 200,
                    value: this.services.templatingService.getCandidateTemplate(candidate, this.services.recruiterService.getAll(), "Interview scheduled")
                });
        }

        return Promise.resolve({
            type: "",
            statusCode: 200,
            value: {}
        });
    }

    protected async handleTeamsSigninTokenExchange(context: TurnContext, query: SigninStateVerificationQuery): Promise<void> {
        await this.invokeHandler.handleSignInVerifyState(context);
    }

    private hasFiles(activity: Activity) : boolean {
        return activity.attachments?.some(x => x.contentType == "application/vnd.microsoft.teams.file.download.info") || false;
    }
}