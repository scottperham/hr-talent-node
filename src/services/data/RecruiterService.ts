import { Recruiter } from "./dtos";
import { DataService } from "./DataService";
import { ServiceContainer } from "./ServiceContainer";


export class RecruiterService extends DataService<Recruiter> {

    constructor(services: ServiceContainer) {
        super("recruiters", services);
    }

    protected expand(obj: Recruiter): Recruiter {
        obj.positions = this.services.positionService.getByRecruiterId(obj.id);
        return obj;
    }

    public getByName(name: string): Recruiter | undefined {
        return this.filterOne(x => x.name == name);
    }
}
