import { Dialog, DialogContext, DialogTurnResult } from "botbuilder-dialogs";

export class HelpDialog extends Dialog {
    constructor() {
        super("HelpDialog")
    }

    async beginDialog(dc: DialogContext, options?: {}): Promise<DialogTurnResult<any>> {
        const helpMessage = "HELP RESPONSE";

        await dc.context.sendActivity(helpMessage);
        return await dc.endDialog();
    }
}