import {InsightDataset, InsightDatasetKind} from "./IInsightFacade";

export class Dataset implements InsightDataset {
    public id: string;
    public kind: InsightDatasetKind;
    public courses: Course[];
    public numRows: number;
}

export class Course {
    public name: string;
    public sections: Section[];
}

export class Section {
    public dept: string;
    public id: string;
    public avg: number;
    public instructor: string;
    public title: string;
    public pass: number;
    public fail: number;
    public audit: number;
    public uuid: string;
    public year: number;
}
