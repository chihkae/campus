import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";
import QueryValidator from "./QueryValidator";
import QueryEvaluator from "./QueryEvaluator";

export interface IQueryValidator {
    validateQuery(query: any): boolean;
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
        return Promise.reject("Not implemented.");
    }

    public removeDataset(id: string): Promise<string> {
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise <any[]> {
            return new Promise(function (resolve, reject) {
                let queryValidator = new QueryValidator();
                try {
                    if (queryValidator.validateQuery(query)) {
                        let fs = require("fs");
                        fs.readFile("./test/data/dummy.txt", (err: any, data: any) => {
                            if (err) {
                                reject("err");
                            } else {
                                try {
                                    let content = JSON.parse(data);
                                    let queryEvaluator = new QueryEvaluator(query, content);
                                    let unsortedResult = queryEvaluator.evaluateResult(query);
                                    let keys = queryValidator.getColumnsKeyWithoutUnderscore();
                                    let selectedColumnsResult = queryEvaluator.selectColumns(unsortedResult, keys);
                                    let orderkeys = queryValidator.getOrderKeyWithoutUnderscore();
                                    let sorted = queryEvaluator.sort(selectedColumnsResult, orderkeys);
                                    resolve(sorted);
                                } catch (err) {
                                    Log.info(err);
                                }
                            }
                        });
                    }
                } catch (err) {
                    reject(new InsightError());
                }
            });
    }
    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.reject("Not implemented.");
    }
}
