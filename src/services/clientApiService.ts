import { ServiceContainer } from "./data/ServiceContainer";
import { Candidate } from "./data/dtos";

export class ClientApiService {

    services: ServiceContainer;

    constructor(services: ServiceContainer) {
        this.services = services;
    }

    public getCandidate(id: number): Candidate | undefined {
        return this.services.candidateService.getById(id);
    }
}