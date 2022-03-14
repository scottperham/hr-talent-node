import { IdentifiableEntity } from "./dtos";
import * as fs from 'fs';
import * as path from 'path';
import { ServiceContainer } from "./ServiceContainer";


export class DataService<T extends IdentifiableEntity> {
    private data: T[] = [];
    private sampleDataFile: string;
    protected services: ServiceContainer;

    constructor(sampleDataFile: string, services: ServiceContainer) {
        this.sampleDataFile = sampleDataFile;
        this.services = services;
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
        });
    }

    private cloneOne(obj: T | undefined) : T | undefined {
        if (!obj) {
            return obj;
        }
        return Object.assign({}, obj);
    }

    private cloneAll(objs: T[]): T[] {
        const clones: T[] = [];
        objs.forEach(x => {if (x) clones.push(<T>this.cloneOne(x)); });
        return clones;
    }

    public getById(id: number, expand: boolean = false): T | undefined {
        const obj = this.cloneOne(this.getReference(id));
        return obj && expand ? this.expand(obj) : obj;
    }

    protected getReference(id: number): T | undefined {
        return this.data.find(x => x.id == id);
    }

    protected getNextId(): number {
        let maxId = 0;
        this.data.forEach(x => maxId = Math.max(maxId, x.id || 0));
        return maxId + 1;
    }

    public getAll(expand: boolean = false): T[] {
        const data = this.cloneAll(this.data);
        return expand ? this.expandAll(data) : data;
    }

    protected decorate(obj: T) { }
    protected expand(obj: T): T { return obj; }

    private expandAll(objs: T[]): T[] {
        objs.forEach(x => this.expand(x));
        return objs;
    }

    protected filter(predicate: (obj: T) => boolean, take?: number, expand: boolean = false): T[] {
        let results = this.cloneAll(this.data.filter(predicate));
        if (expand) {
            results = this.expandAll(results);
        }
        if (take) {
            results = results.slice(0, take);
        }
        return results;
    }

    protected filterOne(predicate: (obj: T) => boolean, take?: number, expand: boolean = false): T | undefined {
        const result = this.cloneOne(this.data.find(predicate));
        if (result && expand) {
            this.expand(result);
        }
        return result;
    }

    protected add(obj: T) {
        this.data.push(obj);
    }
}
