import { ComponentDialog, Dialog, DialogContext, DialogTurnResult } from 'botbuilder-dialogs'

export enum InterruptionAction {
    Resume,
    Waiting,
    End,
    NoAction
}

export abstract class InterruptableDialog extends ComponentDialog {

    constructor(dialogId: string) {
        super(dialogId)
    }

    protected async onBeginDialog(innerDC: DialogContext, options?: {}): Promise<DialogTurnResult<any>> {
        if (innerDC.dialogs.find(super.id)) {
            return await innerDC.beginDialog(super.id, options);
        }
        else {
            return await innerDC.beginDialog(super.initialDialogId, options);
        }
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

        return await super.onContinueDialog(innerDC);        
    }
    
    protected /*virtual*/ onInterruptDialog(dc: DialogContext) : Promise<InterruptionAction> {
        return Promise.resolve(InterruptionAction.NoAction);
    }
}