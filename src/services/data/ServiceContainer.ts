import { PositionService } from "./PositionService";
import { RecruiterService } from "./RecruiterService";
import { TemplatingService } from "./TemplatingService";
import { LocationService } from "./LocationService";
import { InterviewService } from "./InterviewService";
import { CandidateService } from "./CandidateService";


export class ServiceContainer {
    public candidateService: CandidateService;
    public interviewService: InterviewService;
    public locationService: LocationService;
    public positionService: PositionService;
    public recruiterService: RecruiterService;
    public templatingService: TemplatingService;

    constructor() {
        this.candidateService = new CandidateService(this);
        this.interviewService = new InterviewService(this);
        this.locationService = new LocationService(this);
        this.positionService = new PositionService(this);
        this.recruiterService = new RecruiterService(this);
        this.templatingService = new TemplatingService();
    }

    public loadData(sampleDataPath: string) {
        this.candidateService.load(sampleDataPath);
        this.interviewService.load(sampleDataPath);
        this.locationService.load(sampleDataPath);
        this.positionService.load(sampleDataPath);
        this.recruiterService.load(sampleDataPath);
    }

    public loadTemplates(templatesPath: string) {
        this.templatingService.load(templatesPath);
    }
}
