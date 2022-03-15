import { Interview } from "./dtos";
import { DataService } from "./DataService";
import { ServiceContainer } from "./ServiceContainer";


export class InterviewService extends DataService<Interview> {

    constructor(services: ServiceContainer) {
        super("interviews", services);
    }

    protected expand(obj: Interview): Interview {
        obj.recruiter = this.services.recruiterService.getById(obj.recruiterId);
        return obj;
    }

    public scheduleInterview(interview: Interview) {
        interview.id = this.getNextId();
        this.add(interview);
    }

    public getByCandidateId(id: number, expand: boolean = false): Interview[] {
        return this.filter(x => x.candidateId == id, undefined, expand);
    }
}
