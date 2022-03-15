import { CardFactory, MessageFactory, TurnContext } from "botbuilder";
import { ServiceContainer } from "../services/data/serviceContainer";
import { CommandBase } from "./commandBase";


export class CandidateDetailsCommand extends CommandBase {

    constructor(services: ServiceContainer) {
        super("candidate details", services);
    }

    public async execute(turnContext: TurnContext): Promise<void> {
        const text = this.getTextWithoutCommand(turnContext.activity.text);
        const candidate = await this.services.candidateService.searchOne(text);
        const recruiters = await this.services.recruiterService.getAllInterviewers();

        if (!candidate) {
            await turnContext.sendActivity("Cannot find that candidate");
            return;
        }

        const activity = MessageFactory.attachment({
            contentType: CardFactory.contentTypes.adaptiveCard,
            content: this.services.templatingService.getCandidateTemplate(candidate, recruiters)
        });

        await turnContext.sendActivity(activity);
    }
}


