import { isValidUuid } from '@azure/ms-rest-js';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';
import { Chat, NullableOption, User, UserScopeTeamsAppInstallation } from 'microsoft-graph';

type ODataCollection<T> = {
    value: T[]
}

type ChatIdResponse = Partial<{
    upnOrOid: string
    chatId: string
}>;

export enum InstallBotResult {
    Success,
    AliasNotFound,
    MissingToken
}

export class GraphApiService {

    public async getAppToken(tenantId: string) : Promise<string | undefined> {
        const cca = new ConfidentialClientApplication({
            auth: {
                clientId: process.env.MicrosoftAppId!,
                clientSecret: process.env.MicrosoftAppPassword,
                authority: `https://login.microsoftonline.com/${tenantId}`
            }
        });

        const result = await cca.acquireTokenByClientCredential({
            scopes: ["https://graph.microsoft.com/.default"]
        });

        return result?.accessToken;
    }

    public async installBotForUser(aliasUpnOrOid: string, tenantId: string): Promise<InstallBotResult> {
        const token = await this.getAppToken(tenantId);
        if (!token) {
            return InstallBotResult.MissingToken;
        }
        const graphClient = this.getGraphClient(token);
        const upnOrOid = await this.getUpnOrOidFromAlias(graphClient, aliasUpnOrOid);

        if (!upnOrOid) {
            return InstallBotResult.AliasNotFound;
        }

        const teamsApps = await graphClient.api("/appCatalogs/teamsApps")
            .filter(`distributionMethod eq 'organization' and externalId eq '${process.env.TeamsAppId}'`)
            .get() as ODataCollection<any>;

        if (teamsApps.value.length > 0 && teamsApps.value[0].id) {

            try {
                await graphClient.api(`/users/${upnOrOid}/teamwork/installedApps`).post({
                    "teamsApp@odata.bind": `https://graph.microsoft.com/v1.0/appCatalogs/teamsApps/${teamsApps.value[0].id}`
                });
            }
            catch (err: any) {
                if (!err.hasOwnProperty("statusCode") || err["statusCode"] !== 409) {
                    throw err;
                }
            }
            await this.getProactiveChatIdForUserInternal(graphClient, upnOrOid);
        }

        return InstallBotResult.Success;
    }

    public async getProactiveChatIdForUser(aliasUpnOrOid: string, tenantId: string): Promise<ChatIdResponse | undefined> {
        const token = await this.getAppToken(tenantId);
        if (!token) {
            return undefined;
        }
        const graphClient = this.getGraphClient(token);
        return await this.getProactiveChatIdForUserInternal(graphClient, aliasUpnOrOid);
    }

    private async getProactiveChatIdForUserInternal(graphClient: Client, aliasUpnOrOid: string) : Promise<ChatIdResponse> {
        

        const upnOrOid = await this.getUpnOrOidFromAlias(graphClient, aliasUpnOrOid);

        if (!upnOrOid) {
            return {};
        }

        const installedApps = await graphClient.api(`/users/${upnOrOid}/teamwork/installedapps`)
            .filter(`teamsApp/externalId eq '${process.env.TeamsAppId}'`)
            .expand("teamsApp")
            .get() as ODataCollection<UserScopeTeamsAppInstallation>;

        if (installedApps.value.length == 0) {
            return {upnOrOid};
        }

        const chat = await graphClient.api(`/users/${upnOrOid}/teamwork/installedApps/${installedApps.value[0].id}/chat`).get() as Chat;

        return {upnOrOid, chatId: chat.id};
    }

    public async getUpnOrOidFromAlias(graphClient: Client, aliasUpnOrOid: string) : Promise<NullableOption<string>> {
        if (aliasUpnOrOid.indexOf("@") > 0) {
            return aliasUpnOrOid;
        }

        if (isValidUuid(aliasUpnOrOid)) {
            return aliasUpnOrOid;
        }

        const users = await graphClient
            .api("/users")
            .filter(`startsWith(userPrincipalName, '${aliasUpnOrOid}@')`)
            .get() as ODataCollection<User>;

        if (users.value.length == 0) {
            return null;
        }

        return users.value[0].userPrincipalName || null;
    }

    private getGraphClient(token: string) : Client {
        return Client.init({
            authProvider: async (done) => done(null, token)
        });
    }
}