import { ConversationState, InvokeResponse, TurnContext } from "botbuilder";
import { TokenProvider } from "./tokenProvider";

export class InvokeActivityHandler {

    tokenProvider: TokenProvider;
    conversationState: ConversationState;

    constructor(tokenProvider: TokenProvider, conversationState: ConversationState) {
        this.tokenProvider = tokenProvider;
        this.conversationState = conversationState;
    }

    public async handleSignInVerifyState(turnContext: TurnContext) : Promise<InvokeResponse> {
        const token = turnContext.activity.value?.token;

        if (token) {
            await this.tokenProvider.setToken(token, turnContext);
            await turnContext.sendActivity("You have signed in successfully. Please type the command one more time");
        }

        await this.conversationState.clear(turnContext);

        return {
            status: 200
        };
    }
}