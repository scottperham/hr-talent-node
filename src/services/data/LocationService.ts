import { Location } from "./dtos";
import { DataService } from "./DataService";
import { ServiceContainer } from "./ServiceContainer";


export class LocationService extends DataService<Location> {

    constructor(services: ServiceContainer) {
        super("locations", services);
    }

    protected decorate(obj: Location): void {
        obj.locationAddress = `${obj.city}${!obj.state ? "" : `, ${obj.state}`}`;
    }
}
