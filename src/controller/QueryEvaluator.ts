import {InsightError, ResultTooLargeError} from "./IInsightFacade";
import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {IQueryValidator} from "./InsightFacade";
import JSONCov = Mocha.reporters.JSONCov;

export default class QueryEvaluator {

    private query: string;
    private data: any;
    private result: string[];

    constructor(query: any, data: object) {
        this.query = query;
        this.data = data;
        this.result = [];
    }

    /*private getQuery(): string {
        if (this.query !== undefined) {
            return this.query;
        }
        return null;
    }*/

    private getData(): any {
        if (this.data !== undefined) {
            return this.data;
        }
        return null;
    }

    private whereWithNoFilter(query: any, key: any): any[] {
            let totalData =  this.getData();
            let onlyCourses = [];
            for (const courses of Object.values(totalData.courses)) {
                for (const section of Object.values(Object(courses).sections)) {
                    onlyCourses.push(section);
                }
            }
            return onlyCourses;
    }

    public evaluateResult(query: any): any[] {
        for (const key of Object.keys(query)) {
            if (key === "WHERE") {
                if (Object.keys(query[key]).length === 0) {
                   return this.whereWithNoFilter(query, key);
                } else {
                    return this.evaluateResult(query[key]);
                }
            } else if (key === "IS") {
                let isKey = Object.keys(query[key]).toString();
                isKey = isKey.toString().substring(isKey.indexOf("_") + 1);
                let isValue = Object.values(query[key]);
                let currentResult = this.evaluateIS(isKey, isValue);
                return currentResult;
            } else if (key === "NOT") {
                let currentResult = this.evaluateResult(query[key]);
                return this.evaluateNot(currentResult);
            } else if (key === "GT" || key === "LT" || key === "EQ") {
                let val = Object.values(query[key]).toString();
                let sign = key;
                let keyToCompare = Object.keys(query[key]).toString();
                keyToCompare = keyToCompare.substring(keyToCompare.indexOf("_") + 1);
                let currentResult = this.evaluateComparator(keyToCompare, val, sign);
                return currentResult;
            } else if (key === "OR") {
                return this.evaluateORArray(query[key]);
            } else if (key === "AND") {
                return this.evaluateANDArray(query[key]);
            } else {
                throw new InsightError();
            }
        }
    }

    private evaluateORArray(query: any): any {
        if (Array.isArray(query)) {
            if (query != null && typeof query === "object") {
                let innerResult = [];
                for (const value of Object.values(query)) {
                    let currentResult = this.evaluateResult(value);
                    innerResult = this.evaluateOR(innerResult, currentResult);
                }
                return innerResult;
            }
        } else {
            throw new InsightError("OR object is not an array");
        }
    }

    private evaluateANDArray(query: any): any {
        if (Array.isArray(query)) {
            if (query != null && typeof query === "object") {
                let innerResult = [];
                let count = 1;
                for (const value of Object.values(query)) {
                    let currentResult = this.evaluateResult(value);
                    if (currentResult === undefined) {
                        throw new Error("couldn't not compute one of the filters in And");
                    }
                    if (count === 1) {
                        innerResult = currentResult;
                        count++;
                    }
                    innerResult = this.evaluateAnd(innerResult, currentResult);
                }
                return innerResult;
            }
        } else {
            throw new InsightError("And object is not an array");
        }
    }

    private evaluateIS(key: any, value: any): any[] {
        let content = this.getData();
        let countNumberofAsterisks = value.toString().split("*").length - 1;

        let result: any[] = [];
        content.courses.forEach(function (course: any) {
            course.sections.forEach(function (section: any) {
                if (countNumberofAsterisks > 0) {
                    if (countNumberofAsterisks === 1) {
                        if (value.toString().indexOf("*") > 0) {
                            let stringbeforeAsterik = value.toString().substring(0, (value.toString().length - 1));
                            if (section[key].toString().startsWith(stringbeforeAsterik)) {
                                result.push(section);
                            }
                        } else if (value.toString().indexOf("*") === 0) {
                            let stringAfterAsterik = value.toString().substring(1, (value.toString().length));
                            if (section[key].toString().endsWith(stringAfterAsterik)) {
                                result.push(section);
                            }
                        }
                    } else if (countNumberofAsterisks === 2) {
                        let stringBetweenAsterik = value.toString().substring(1, (value.toString().length - 1));
                        if (section[key].toString().includes(stringBetweenAsterik)) {
                            result.push(section);
                        }
                    }
                } else {
                    if (section[key].toString() === value.toString()) {
                        result.push(section);
                    }
                }
            });
        });
        return result;
    }

    private evaluateAnd(result1: any, result2: any): any {
        return result1.filter(function (e1: string) {
            return result2.indexOf(e1) > -1;
        });
    }

    public addID(result: any[], id: string, keys: string[], nonGroupKeys: string[]): any[] {
        let list = [];
        for (const val of result) {
            let obj: any = {};
            let newKey;
            for (const key of Object.keys(val)) {
                if (nonGroupKeys !== undefined) {
                    if (nonGroupKeys.indexOf(key) === -1) {
                        newKey = id.concat("_", key.toString());
                    } else {
                        newKey = key;
                    }
                    obj[newKey] = val[key];
                } else {
                    newKey = id.concat("_", key.toString());
                    obj[newKey] = val[key];
                }
            }
            list.push(obj);
        }
        return list;
    }

    /*public sort(result: any, keyToSort: any[]): any[] {
        if()
        let sortedResult = [];
        if (keyToSort === "instructor" || keyToSort === "title" || keyToSort === "dept" || keyToSort === "id" ||
keyToSort === "uuid") {
                sortedResult = result.sort(function (a: any, b: any) {
                    return a[keyToSort].toString().localeCompare(b[keyToSort].toString());
                });
            } else {
                sortedResult = result.sort(function (a: any, b: any) {
                    return Number(a[keyToSort]) - Number(b[keyToSort]);
                });
            }
        return sortedResult;
    }*/

    private evaluateOR(result1: any, result2: any): any {
        let merged = result1.concat(result2);
        let removedDuplicateofMerged = merged.filter(function (item: any, pos: any) {
            return merged.indexOf(item) === pos;
        });
        return removedDuplicateofMerged;
    }

    private evaluateNot(result: any): any {
        let content = this.getData();
        let notResult = [];
        for (const section of Object.values(content.courses)) {
            for (const courseSection of Object.values(Object(section).sections)) {
                if (!result.includes(courseSection)) {
                    notResult.push(courseSection);
                }
            }
        }
        return notResult;
    }

    public selectColumns(result: any, keys: any): any {
            for (let i = 0 ; i < Object(result).length ; i++) {
                for (const key of Object.keys(result[i])) {
                    if (keys.indexOf(key) === -1) {
                        delete result[i][key];
                    }
                }
            }
            return result;
    }

    private evaluateComparator(key: any, value: any, comparator: any): any {
        let content = this.getData();
        let result: any[] = [];
        content.courses.forEach(function (course: any) {
            course.sections.forEach(function (section: any) {
                if (comparator === "GT") {
                    if (section[key] > Number(value)) {
                        result.push(section);
                    }
                } else if (comparator === "LT") {
                    if (section[key] < Number(value)) {
                        result.push(section);
                    }
                } else if (comparator === "EQ") {
                    if (section[key] === Number(value)) {
                        result.push(section);
                    }
                }
            });
        });
        return result;
    }
}
