import { Position } from "./dtos";
import { DataService } from "./DataService";
import { ServiceContainer } from "./ServiceContainer";
import { randomUUID } from "crypto";


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

    protected decorate(obj: Position): void {
        obj.externalId = randomUUID().substring(0, 8).toUpperCase();
    }

    public getOpenPositions(): Position[] {
        return this.getAll(true);
    }

    public getByRecruiterId(id: number): Position[] {
        return this.filter(x => x.hiringManagerId == id);
    }

    public searchOne(searchText: string) : Position | undefined {
        const positions = this.search(searchText, 1);
        return positions.length == 0 ? undefined : positions[0];
    }

    public search(searchText: string | undefined, maxResults: number) : Position[] {

        if (!searchText) {
            return this.filter(x => true, maxResults, true);
        }
        
        searchText = searchText.trim();

        const id = parseInt(searchText);

        if (id) {
            const position = this.getById(id, true);
            return position ? [position] : [];
        }

        return this.filter(x => x.title.indexOf(<string>searchText) > -1, maxResults, true);
    }
}
