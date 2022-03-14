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

    public scheduleInterview(candidateId: number, recruiterId: number, interviewDate: Date, interviewType: string, isRemote: boolean) {
        this.add({
            candidateId,
            id: this.getNextId(),
            interviewDate,
            recruiterId
        });
    }

    public getByCandidateId(id: number, expand: boolean = false): Interview[] {
        return this.filter(x => x.candidateId == id, undefined, expand);
    }
}
