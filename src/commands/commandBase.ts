import { TurnContext } from "botbuilder";

export abstract class CommandBase {
    public id: string;

    constructor (id: string) {
        this.id = id;
    }

    public abstract Execute(turnContext: TurnContext) : Promise<void>;

    protected getTextWithoutCommand(text: string) : string {
        return text.trim().substring(this.id.length).trim();
    }
}