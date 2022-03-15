import { ServiceContainer } from "./data/serviceContainer";
import { Candidate } from "./data/dtos";

export class ClientApiService {

    services: ServiceContainer;

    constructor(services: ServiceContainer) {
        this.services = services;
    }

    public async getCandidate(id: number): Promise<Candidate | undefined> {
        return await this.services.candidateService.getById(id);
    }
}