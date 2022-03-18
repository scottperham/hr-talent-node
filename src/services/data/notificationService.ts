import { Activity, CloudAdapter } from "botbuilder";
import { ServiceContainer } from "./serviceContainer";

export enum NotificationResult {
    Success,
    AliasNotFound,
    BotNotInstalled
}

export class NotificationService {
    
    adapter: CloudAdapter;
    services: ServiceContainer;

    constructor(services: ServiceContainer, adapter: CloudAdapter) {
        this.services = services;
        this.adapter = adapter;
    }

    // public sendProactiveNotification(aliasUpnOrOid: string, tenantId: string, activity: Partial<Activity>) : Promise<NotificationResult> {

    // }

}
