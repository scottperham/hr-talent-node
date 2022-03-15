import { parseBool } from "adaptivecards";
import { AdaptiveCardInvokeResponse, CardFactory, InvokeResponse, MessagingExtensionAttachment, MessagingExtensionQuery, MessagingExtensionResponse, TurnContext } from "botbuilder";
import { convertInvokeActionDataToComment, convertInvokeActionDataToInterview } from "./data/dtos";
import { ServiceContainer } from "./data/ServiceContainer";
import { TokenProvider } from "./tokenProvider";

export class InvokeActivityHandler {

    tokenProvider: TokenProvider;
    services: ServiceContainer;

    constructor(tokenProvider: TokenProvider, services: ServiceContainer) {
        this.tokenProvider = tokenProvider;
        this.services = services;
    }

    public async handleSignInVerifyState(turnContext: TurnContext) : Promise<InvokeResponse> {
        const token = turnContext.activity.value?.token;

        if (token) {
            await this.tokenProvider.setToken(token, turnContext);
            await turnContext.sendActivity("You have signed in successfully. Please type the command one more time");
        }

        return {
            status: 200
        };
    }

    public handleMessagingExtensionQuery(query: MessagingExtensionQuery, source: string): Promise<MessagingExtensionResponse> {
        const initialRun = parseBool(query.parameters?.find(x => x.name == "initialRun")?.value);
        const maxResults = initialRun ? 5 : (query.queryOptions?.count || 5);
        const searchText = query.parameters?.find(x => x.name == "searchText")?.value;

        const attachments: MessagingExtensionAttachment[] = [];

        switch(query.commandId) {
            case "searchPositions":
                const positions = this.services.positionService.search(searchText, maxResults);
                positions.forEach(x => {
                    attachments.push({
                        contentType: CardFactory.contentTypes.adaptiveCard,
                        content: this.services.templatingService.getPositionTemplate(x),
                        preview: this.services.templatingService.getPositionPreviewTemplate(x)
                    })
                });
                break;
            case "searchCandidates":
                const candidates = this.services.candidateService.search(searchText, maxResults);
                const recruiters = this.services.recruiterService.getAll(true);
                candidates.forEach(x => {
                    attachments.push({
                        contentType: CardFactory.contentTypes.adaptiveCard,
                        content: this.services.templatingService.getCandidateTemplate(x, recruiters, "", source === "compose"),
                        preview: this.services.templatingService.getCandidatePreviewTemplate(x)
                    })
                });
                break;
        }

        return Promise.resolve({
            composeExtension: {
                attachments,
                type: "result",
                attachmentLayout: "list"
            }
        });
    }

    public async handleLeaveComment(invokeData: any, authorName: string): Promise<AdaptiveCardInvokeResponse> {
        const comment = convertInvokeActionDataToComment(invokeData, authorName);
        const candidate = this.services.candidateService.getById(comment.candidateId, true);

        if (!candidate) {
            return await this.getAdaptiveCardInvokeResponse(404);
        }

        this.services.candidateService.saveComment(comment);
        return await this.getAdaptiveCardInvokeResponse(200, this.services.templatingService.getCandidateTemplate(candidate, this.services.recruiterService.getAll(), "Comment added"));
    }

    public async handleScheduleInterview(invokeData: any): Promise<AdaptiveCardInvokeResponse> {
        const interview = convertInvokeActionDataToInterview(invokeData);
        const candidate = this.services.candidateService.getById(interview.candidateId, true);

        if (!candidate) {
            return await this.getAdaptiveCardInvokeResponse(404);
        }

        this.services.interviewService.scheduleInterview(interview);
        return await this.getAdaptiveCardInvokeResponse(200, this.services.templatingService.getCandidateTemplate(candidate, this.services.recruiterService.getAll(), "Interview scheduled"));
    }

    private getAdaptiveCardInvokeResponse(status: number, card?: any): Promise<AdaptiveCardInvokeResponse> {
        return Promise.resolve({
            type: card ? CardFactory.contentTypes.adaptiveCard : "",
            statusCode: status,
            value: card ? card : {}
        });
    }
}