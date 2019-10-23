import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, ResultTooLargeError} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";
import * as JSZip from "jszip";
import {JSZipObject} from "jszip";
import {type} from "os";
import Dataset, {
    Course,
    Section,
    addCoursesDataset,
    addRoomsDataset,
    validateId,
    getCurrentlyAddedDatasetIds
} from "./Dataset";

import {QueryValidator} from "./QueryValidator";
import QueryEvaluator from "./QueryEvaluator";
import QueryGrouper from "./QueryGrouper";
import {Query} from "./Query";
import QueryApplier from "./QueryApplier";
import QuerySorter from "./QuerySorter";
import {ResultHandler} from "./ResultHandler";

export interface IQueryValidator {
    validateQuery(query: any): boolean;
    getQuery(): Query;
}

export interface IQuery {
    setWhere(s: string): void;
    getWhere(): string;
    setOptions(s: string): void;
    getOptions(): string;
    setColumns(s: string): void;
    setColumnsKey(s: string[]): void;
    getColumnsKey(): string[];
    getColumnsKeyWithoutUnderscore(): string[];
    getOrderKeyWithoutUnderscore(): any[];
    setOrderKey(s: string): void;
    getOrderKey(): string[];
    setIdString(s: string): void;
    getIdString(): string;
    setGroup(s: string[]): void;
    setTransformations(s: string): void;
}

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        // Validate id (must not contain underscore, be only whitespace, be null)
        // If invalid, reject with InsightError
        if (!validateId(id)) {
            return Promise.reject(new InsightError("id is invalid"));
        }
        // If is has already been added, reject
        if (getCurrentlyAddedDatasetIds().includes(id)) {
            return Promise.reject((new InsightError("A dataset with a corresponding Id has already been added")));
        }

        if (kind === InsightDatasetKind.Courses) {
            return addCoursesDataset(id, content, kind);
        } else if (kind === InsightDatasetKind.Rooms) {
            return addRoomsDataset(id, content, kind);
        }
    }

    public removeDataset(id: string): Promise<string> {
        // Validate id (must not contain underscore, be only whitespace, be null)
        // If invalid, reject with InsightError
        if (!validateId(id)) {
            return Promise.reject(new InsightError("id is invalid"));
        }
        // If is has not already  been added, reject
        if (!getCurrentlyAddedDatasetIds().includes(id)) {
            return Promise.reject((new NotFoundError("A dataset with a corresponding Id has already been added")));
        }

        const fs = require("fs");
        const path = `./data/${id}`;
        fs.unlinkSync(path);
        Log.info(`removed ${id} from disk`);
        return Promise.resolve(id);
    }

    public performQuery(query: any): Promise <any[]> {
        return new Promise(function (resolve, reject) {
            let queryValidator = new QueryValidator(query);
            try {
                if (queryValidator.validateQuery(query)) {
                    queryValidator.getQueryOrderValidator().checkMinRequirements();
                    let fileIDtoRead = queryValidator.getQuery().getIdString();
                    let fs = require("fs");
                    fs.readFile(`./data/${fileIDtoRead}`, (err: any, data: any) => {
                        if (err) {
                            reject(new InsightError());
                        } else {
                            try {
                                let content = JSON.parse(data);
                                let queryEvaluator = new QueryEvaluator(query, content);
                                let unsortedResult = queryEvaluator.evaluateResult(query);
                                let rh: ResultHandler = new ResultHandler(queryEvaluator, queryValidator);
                                resolve(rh.format(unsortedResult));
                            } catch (e) {
                                if (e instanceof ResultTooLargeError) {
                                    reject(e);
                                } else if (e instanceof InsightError) {
                                    reject(e);
                                } else {
                                    reject(e);
                                }
                            }
                        }
                    });
                }
            } catch (e) {
                reject(new InsightError());
            }
        });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        const fs = require("fs");
        let currentlyAddedDatasets: string[] = fs.readdirSync("data");
        let toReturn: InsightDataset[] = [];
        currentlyAddedDatasets.forEach(function (dataset) {
            let datasetAsString: string = fs.readFileSync(`./data/${dataset}`).toString();
            // theoretically this JSON.parse() call should always work,
            // since we have validation when we add the dataset, they should all be properly formatted
            let datasetJson = JSON.parse(datasetAsString);
            const datasetToAdd: InsightDataset = {} as InsightDataset;
            datasetToAdd.id = datasetJson.id;
            datasetToAdd.kind = datasetJson.kind;
            datasetToAdd.numRows = datasetJson.numRows;
            toReturn.push(datasetToAdd);
        });
        toReturn.forEach(function (d) {
            Log.info(`Found dataset id "${d.id}" with kind: "${d.kind}" and numRows: ${d.numRows}`);
        });
        return Promise.resolve(toReturn);
    }
}
