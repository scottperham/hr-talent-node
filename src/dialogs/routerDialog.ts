import { Dialog, DialogContext, DialogEvent, DialogTurnResult, DialogTurnStatus } from "botbuilder-dialogs";
import { InterruptableDialog, InterruptionAction } from "./interruptableDialog";

export abstract class RouterDialog extends InterruptableDialog {
    constructor(dialogId: string) {
        super(dialogId);
    }

    protected onBeginDialog(innerDC: DialogContext, options?: {}): Promise<DialogTurnResult<any>> {
        return this.onContinueDialog(innerDC);
    }

    protected async onContinueDialog(innerDC: DialogContext): Promise<DialogTurnResult<any>> {
        const status = await this.onInterruptDialog(innerDC);

        if (status == InterruptionAction.Resume) {
            await innerDC.repromptDialog();
            return Dialog.EndOfTurn;
        }

        if (status == InterruptionAction.Waiting) {
            return Dialog.EndOfTurn;
        }

        const activity = innerDC.context.activity;

        //IsStartActivity
        if (activity.type == "conversationUpdate" && activity.membersAdded?.some(x => x.id == activity.recipient.id)) {
            await this.onStart(innerDC)   ;
        }

        switch(activity.type) {
            case "message":
                if (activity.value) {
                    await this.onEvent(innerDC);
                }
                else {
                    const result = await innerDC.continueDialog();

                    switch(result.status) {
                        case DialogTurnStatus.empty:
                            await this.Route(innerDC);
                            break;
                        case DialogTurnStatus.complete:
                            await innerDC.endDialog();
                            break;
                    }

                }

                if (!innerDC.activeDialog) {
                    await this.complete(innerDC);
                }

                break;
            case "event":
                await this.onEvent(innerDC);
                break;
            case "invoke":
                await innerDC.continueDialog();
                break;
            default:
                await this.onSystemMessage(innerDC);
                break;
        }

        return Dialog.EndOfTurn;
    }

    public async complete(innerDc: DialogContext) : Promise<any> {
        await innerDc.endDialog();
    }

    public onStart(innerDc: DialogContext) : Promise<any> {
        return Promise.resolve();
    }

    public onEvent(innerDc: DialogContext) : Promise<any> {
        return Promise.resolve();
    }

    public onSystemMessage(innerDc: DialogContext) : Promise<any> {
        return Promise.resolve();
    }

    public abstract Route(innerDc: DialogContext) : Promise<any>;
}