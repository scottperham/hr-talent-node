import { UserState } from "botbuilder";
import { DialogContext, OAuthPrompt } from "botbuilder-dialogs";
import { TokenProvider } from "../services/tokenProvider";
import { HelpDialog } from "./helpDialog";
import { RouterDialog } from "./routerDialog";

export class MainDialog extends RouterDialog {

    tokenProvider: TokenProvider;

    constructor(tokenProvider: TokenProvider) {
        super("MainDialog")

        this.tokenProvider = tokenProvider;

        this.addDialog(new HelpDialog());
        this.addDialog(new OAuthPrompt("OAuthPrompt", {
            connectionName: process.env.OAuthConnectionName || "",
            text: "Please sign in to proceed",
            title: "Sign in",
            timeout: 9000
        }))
    }

    public async Route(innerDc: DialogContext): Promise<any> {
        const activityText = innerDc.context.activity.text;

        const commandDialogs: {command: string, dialogId: string, requireAuth: boolean}[] = [
            {command: "help", dialogId: "HelpDialog", requireAuth: true}
        ]

        let responded = false;

        for (let i = 0; i < commandDialogs.length; i++) {

            const commandDialog = commandDialogs[i];

            if (responded) {
                return;
            }

            let dialogId = commandDialog.dialogId;

            if (activityText.toLowerCase().trimStart().startsWith(commandDialog.command)) {
                if (commandDialog.requireAuth) {
                    const token = await this.tokenProvider.getToken(innerDc.context);

                    if (!token) {
                        dialogId = "OAuthPrompt";
                    }
                }

                responded = true;
                await innerDc.beginDialog(dialogId);
            }
        }

        if (!responded) {
            const message = `Sorry, I didn't understand ${activityText}. Type help to explore commands`;
            await innerDc.context.sendActivity(message);
        }
    }
}