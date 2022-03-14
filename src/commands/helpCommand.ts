import { CardFactory, MessageFactory, TurnContext } from "botbuilder";
import { ServiceContainer } from "../services/data/ServiceContainer";
import { CommandBase } from "./commandBase";

export class HelpCommand extends CommandBase {

    constructor() {
        super("help")
    }

    public async Execute(turnContext: TurnContext): Promise<void> {
        const helpMessage = "Hello this is some help text";
        await turnContext.sendActivity(helpMessage);
    }
}

export class CandidateDetailsCommand extends CommandBase {

    services: ServiceContainer

    constructor(services: ServiceContainer) {
        super("asdf")

        this.services = services;
    }

    public async Execute(turnContext: TurnContext): Promise<void> {
        const text = this.getTextWithoutCommand(turnContext.activity.text);
        const candidate = this.services.candidateService.searchOne("Bart Fredrick");

        if (!candidate) {
            await turnContext.sendActivity("Cannot find that candidate");
            return;
        }

        const activity = MessageFactory.attachment({
            contentType: CardFactory.contentTypes.adaptiveCard,
            content: this.services.templatingService.getCandidateTemplate(candidate, this.services.recruiterService.getAll())
        });

        console.log(JSON.stringify(activity, null, 2));

        await turnContext.sendActivity(activity);
    }
}