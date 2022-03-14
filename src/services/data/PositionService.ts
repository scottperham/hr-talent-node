import { Position } from "./dtos";
import { DataService } from "./DataService";
import { ServiceContainer } from "./ServiceContainer";


export class PositionService extends DataService<Position> {

    constructor(services: ServiceContainer) {
        super("positions", services);
    }

    protected expand(obj: Position): Position {
        obj.candidates = this.services.candidateService.getByPosition(obj.id);
        obj.location = this.services.locationService.getById(obj.locationId);
        obj.hiringManager = this.services.recruiterService.getById(obj.hiringManagerId);
        return obj;
    }

    public getOpenPositions(): Position[] {
        return this.getAll(true);
    }

    public getByRecruiterId(id: number): Position[] {
        return this.filter(x => x.hiringManagerId == id);
    }
}
