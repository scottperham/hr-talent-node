import { parseBool } from "adaptivecards";
import { AdaptiveCardInvokeResponse, Attachment, CardFactory, InvokeResponse, MessagingExtensionAction, MessagingExtensionActionResponse, MessagingExtensionAttachment, MessagingExtensionQuery, MessagingExtensionResponse, TurnContext } from "botbuilder";
import { convertInvokeActionDataToComment, convertInvokeActionDataToInterview, convertInvokeActionDataToPosition } from "./data/dtos";
import { ServiceContainer } from "./data/serviceContainer";
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

    public async handleMessagingExtensionSubmitAction(action: MessagingExtensionAction): Promise<MessagingExtensionActionResponse> {
        switch(action.data.commandId) {
            case "createPosition":
                const position = convertInvokeActionDataToPosition(action.data) ;
                await this.services.positionService.createPosition(position);
                const shareAttachment: Attachment = {
                    contentType: CardFactory.contentTypes.adaptiveCard,
                    content: this.services.templatingService.getPositionTemplate(position, true)
                }
                return {
                    task: {
                        type: "continue",
                        value: {
                            card: shareAttachment,
                            title: "New position created",
                            width: "medium",
                            height: "medium"
                        }
                    }
                }
        }

        return {}
    }

    public async handleMessageExtensionFetchTask(action: MessagingExtensionAction): Promise<MessagingExtensionActionResponse> {

        if (action.commandId == "newPosition") {
            const locations = await this.services.locationService.getAll();
            const recruiters = await this.services.recruiterService.getAllHiringManagers();
            const levels: number[] = [1,2,3,4,5,6,7];

            const card = this.services.templatingService.getNewPositionTemplate(recruiters, locations, levels);

            return Promise.resolve({
                task: {
                    type: "continue",
                    value: {
                        card: CardFactory.adaptiveCard(card),
                        title: "Create new position",
                        width: "large",
                        height: "large"
                    }
                }
            });
        }

        return Promise.resolve({});
    }

    public async handleMessagingExtensionQuery(query: MessagingExtensionQuery, source: string): Promise<MessagingExtensionResponse> {
        const initialRun = parseBool(query.parameters?.find(x => x.name == "initialRun")?.value);
        const maxResults = initialRun ? 5 : (query.queryOptions?.count || 5);
        const searchText = query.parameters?.find(x => x.name == "searchText")?.value;

        const attachments: MessagingExtensionAttachment[] = [];

        switch(query.commandId) {
            case "searchPositions":
                const positions = await this.services.positionService.search(searchText, maxResults);
                positions.forEach(x => {
                    attachments.push({
                        contentType: CardFactory.contentTypes.adaptiveCard,
                        content: this.services.templatingService.getPositionTemplate(x),
                        preview: this.services.templatingService.getPositionPreviewTemplate(x)
                    })
                });
                break;
            case "searchCandidates":
                const candidates = await this.services.candidateService.search(searchText, maxResults);
                const recruiters = await this.services.recruiterService.getAll(true);
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
        const candidate = await this.services.candidateService.getById(comment.candidateId, true);
        const recruiters = await this.services.recruiterService.getAll();

        if (!candidate) {
            return this.getAdaptiveCardInvokeResponse(404);
        }

        this.services.candidateService.saveComment(comment);
        return this.getAdaptiveCardInvokeResponse(200, this.services.templatingService.getCandidateTemplate(candidate, recruiters, "Comment added"));
    }

    public async handleScheduleInterview(invokeData: any): Promise<AdaptiveCardInvokeResponse> {
        const interview = convertInvokeActionDataToInterview(invokeData);
        const candidate = await this.services.candidateService.getById(interview.candidateId, true);
        const recruiters = await this.services.recruiterService.getAll();

        if (!candidate) {
            return this.getAdaptiveCardInvokeResponse(404);
        }

        this.services.interviewService.scheduleInterview(interview);
        return this.getAdaptiveCardInvokeResponse(200, this.services.templatingService.getCandidateTemplate(candidate, recruiters, "Interview scheduled"));
    }

    private getAdaptiveCardInvokeResponse(status: number, card?: any): AdaptiveCardInvokeResponse {
        return {
            type: card ? CardFactory.contentTypes.adaptiveCard : "",
            statusCode: status,
            value: card ? card : {}
        };
    }
}