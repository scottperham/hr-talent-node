import { ConfidentialClientApplication } from '@azure/msal-node';
import { ChannelAccount } from 'botbuilder';

export class ConnectorClient {

    public async getAccessToken() : Promise<string | undefined> {
        const cca = new ConfidentialClientApplication({
            auth: {
                clientId: process.env.MicrosoftAppId!,
                clientSecret: process.env.MicrosoftAppPassword,
                authority: `https://login.microsoftonline.com/botframework.com`
            }
        });

        const result = await cca.acquireTokenByClientCredential({
            scopes: ["https://api.botframework.com/.default"]
        });

        return result?.accessToken;
    }

    public async getConversationMembers(serviceUrl: string, conversationId: string): Promise<ChannelAccount[]> {
        const accessToken = await this.getAccessToken();
        const response = await fetch(`${serviceUrl}/v3/conversations/${conversationId}/members`, {
            headers: {
                authorization: `Bearer ${accessToken}`
            }
        });

        const body = await response.json() as ChannelAccount[];

        return body;
    }
}