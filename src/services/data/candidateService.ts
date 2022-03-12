import { IdentifiableEntity, Candidate, Interview, Recruiter, Position, Location } from "./dtos";
import * as fs from 'fs';
import * as path from 'path';
import * as act from 'adaptivecards-templating';
import * as ac from 'adaptivecards';
import { AdaptiveCard } from "adaptivecards";

export class DataService<T extends IdentifiableEntity> {
    protected data: T[] = [];
    private sampleDataFile: string;

    constructor(sampleDataFile: string) {
        this.sampleDataFile = sampleDataFile;
    }

    public load(sampleDataPath: string) {
        const data = fs.readFileSync(path.join(sampleDataPath, this.sampleDataFile + ".json"));
        this.data = <T[]>JSON.parse(data.toString());
        const _this = this;
        this.data.forEach(x => {
            if (!x.id) {
                x.id = _this.getNextId();
            }
            _this.decorate(x);
        })
    }

    public getById(id: number): T | undefined {
        return this.data.find(x => x.id == id);
    }

    protected getNextId() : number {
        let maxId = 0;
        this.data.forEach(x => maxId = Math.max(maxId, x.id || 0));
        return maxId + 1;
    }

    public getAll() : T[] {
        return this.data;
    }

    protected decorate(obj: T) { }
}

export class ServiceContainer {
    public candidateService: CandidateService;
    public interviewService: InterviewService;
    public locationService: LocationService;
    public positionService: PositionService;
    public recruiterService: RecruiterService;
    public templatingService: TemplatingService;

    constructor(candidateService: CandidateService,
        interviewService: InterviewService,
        locationService: LocationService,
        positionService: PositionService,
        recruiterService: RecruiterService,
        templatingService: TemplatingService) {
            this.candidateService = candidateService;
            this.interviewService = interviewService;
            this.locationService = locationService;
            this.positionService = positionService;
            this.recruiterService = recruiterService;
            this.templatingService = templatingService;
        }

    public populateCandidate(candidate: Candidate): Candidate {
        candidate.location = <Location>this.locationService.getById(candidate.locationId);
        candidate.position = <Position>this.positionService.getById(candidate.positionId);
        return candidate;
    }
}

export class CandidateService extends DataService<Candidate> {

    constructor() {
        super("candidates")
    }

    public searchOne(searchText: string) : Candidate | undefined {
        const candidates = this.search(searchText, 1);
        return candidates.length == 0 ? undefined : candidates[0];
    }

    public search(searchText: string, maxResults: number) : Candidate[] {
        searchText = searchText.trim();

        if (!searchText) {
            return this.data.slice(0, maxResults);
        }

        const id = parseInt(searchText);

        if (id) {
            const candidate = this.data.find(x => x.id == id);
            return candidate ? [candidate] : [];
        }

        return this.data.filter(x => x.name.indexOf(searchText) > -1).slice(0, maxResults);
    }
}

export class InterviewService extends DataService<Interview> {
    
    constructor() {
        super("interviews")
    }

    public scheduleInterview(candidateId: number, recruiterId: number, interviewDate: Date, interviewType: string, isRemote: boolean) {
        this.data.push({
            candidateId,
            id: this.getNextId(),
            interviewDate,
            recruiterId
        });
    }
}

export class LocationService extends DataService<Location> {
    
    constructor() {
        super("locations")
    }

    protected decorate(obj: Location): void {
        obj.locationAddress = `${obj.city}${!obj.state ? "" : `, ${obj.state}`}`;
    }
}

export class PositionService extends DataService<Position> {
    
    constructor() {
        super("positions")
    }

}

export class RecruiterService extends DataService<Recruiter> {
    
    constructor() {
        super("recruiters")
    }

}

export class TemplatingService {

    candidateTemplate: string = "";
    templatesPath: string = "";

    public load(templatesPath: string) {
        this.templatesPath = templatesPath;
        this.candidateTemplate = fs.readFileSync(path.join(templatesPath, "candidateTemplate.json")).toString();
    }

    public getCandidateTemplate(candidate: Candidate, recruiters: Recruiter[], status?: string) : any {
        this.candidateTemplate = fs.readFileSync(path.join(this.templatesPath, "candidateTemplate.json")).toString();
        const template = new act.Template(JSON.parse(this.candidateTemplate));
        const payload = template.expand({
            $root: {
                ...candidate, 
                recruiters,
                hasComments: candidate.comments && candidate.comments.length > 0,
                status: status || ""
            }
        });

        return payload;
    }
}