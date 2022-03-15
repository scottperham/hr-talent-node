import { Candidate, Comment } from "./dtos";
import { ServiceContainer } from "./ServiceContainer";
import { DataService } from "./DataService";

export class CandidateService extends DataService<Candidate> {

    constructor(services: ServiceContainer) {
        super("candidates", services)
    }

    protected expand(obj: Candidate): Candidate {
        obj.location = this.services.locationService.getById(obj.locationId);
        obj.position = this.services.positionService.getById(obj.positionId);
        obj.interviews = this.services.interviewService.getByCandidateId(obj.id);

        return obj;
    }

    protected decorate(obj: Candidate): void {
        obj.comments = [];
    }

    public searchOne(searchText: string) : Candidate | undefined {
        const candidates = this.search(searchText, 1);
        return candidates.length == 0 ? undefined : candidates[0];
    }

    public search(searchText: string, maxResults: number) : Candidate[] {
        
        if (!searchText) {
            return this.filter(x => true, maxResults, true);
        }

        searchText = searchText.trim();

        const id = parseInt(searchText);

        if (id) {
            const candidate = this.getById(id, true);
            return candidate ? [candidate] : [];
        }

        return this.filter(x => x.name.indexOf(searchText) > -1, maxResults, true);
    }

    public getByPosition(positionId: number, expand: boolean = false): Candidate[] {
        return this.filter(x => x.positionId == positionId, undefined, expand);
    }

    public saveComment(comment: Comment) {
        const candidate = this.getReference(comment.candidateId);
        if (!candidate) {
            return;
        }

        if (!candidate.comments) {
            candidate.comments = [];
        }

        candidate.comments.push(comment);
    }
}


