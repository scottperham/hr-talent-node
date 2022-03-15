import { CardFactory, MessageFactory, TurnContext } from "botbuilder";
import { ServiceContainer } from "../services/data/serviceContainer";
import { CommandBase } from "./commandBase";


export class PositionDetailsCommand extends CommandBase {

    constructor(services: ServiceContainer) {
        super("position", services);
    }

    public async execute(turnContext: TurnContext): Promise<void> {
        const text = this.getTextWithoutCommand(turnContext.activity.text);
        const position = await this.services.positionService.searchOne(text);

        if (!position) {
            await turnContext.sendActivity("Cannot find that candidate");
            return;
        }

        const activity = MessageFactory.attachment({
            contentType: CardFactory.contentTypes.adaptiveCard,
            content: this.services.templatingService.getPositionTemplate(position)
        });

        await turnContext.sendActivity(activity);
    }
}
