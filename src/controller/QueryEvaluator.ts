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

    private getQuery(): string {
        if (this.query !== undefined) {
            return this.query;
        }
        return null;
    }

    private getData(): any {
        if (this.data !== undefined) {
            return this.data;
        }
        return null;
    }

    public evaluateResult(query: any): any[] {
        for (const key of Object.keys(query)) {
            if (key === "WHERE") {
                if (Object.keys(query[key]).length === 0) {
                    return this.getData();
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
                if (query[key].length > 1) {
                    Log.info("two not keys");
                    throw InsightError;
                }
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
            throw InsightError;
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
                        throw InsightError;
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
            throw InsightError;
        }
    }

    private evaluateIS(key: any, value: any): any {
        let content = this.getData();

        let result: any[] = [];
        content.courses.forEach(function (course: any) {
            course.sections.forEach(function (section: any) {
                let re1 = /^[*]?[^*]*[*]?/g;
                let re2 = /[^*]*[*]?/g;
                let re3 = /^[*]?[^*]*/g;
                let stringBefore = new RegExp("[^*]*" + value.toString() );
                let re4 = /[^*]*/g;
                let stringMiddle = new RegExp("[^*]" + value.toString() + "[^*]*");
                let stringAfter = new RegExp(value.toString() + "[^*]*");
                if (re1.test(value.toString()) && stringMiddle.test(section[key].toString())) {
                    result.push(section);
                } else if (re2.test(value.toString()) && stringAfter.test(section[key].toString())) {
                  result.push(section);
               } else if (re3.test(value.toString()) && stringBefore.test(section[key].toString())) {
                    result.push(section);
                } else if (re4.test(value.toString())) {
                    if (section[key] === value) {
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

    public addID(result: any[], id: string, keys: string[]): any[] {
        let list = [];
        for (const val of result) {
            let obj: any = {};
            for (const key of Object.keys(val)) {
                let newKey = id.concat("_", key.toString());
                obj[newKey] = val[key];
            }
            list.push(obj);
        }
        return list;
    }
    public sort(result: any, keyToSort: string): any[] {
        let sortedResult = [];
        try {
            if (keyToSort === "instructor" || keyToSort === "title" || keyToSort === "dept") {
                sortedResult = result.sort(function (a: any, b: any) {
                    return a[keyToSort].toString().localeCompare(b[keyToSort].toString());
                });
            } else {
                sortedResult = result.sort(function (a: any, b: any) {
                    return Number(a[keyToSort]) - Number(b[keyToSort]);
                });
            }
        } catch (e) {
            if (result["courses"] !== undefined) {
                let counter = 0;
                for (const values of Object(Object.values(result.courses))) {
                    counter += values["sections"].length;
                }
                if (counter > 5000) {
                    throw new ResultTooLargeError();
                }
            }
        }
        return sortedResult;
    }

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
        /*let arrayAfterRemove = content.courses.filter(function (el: any) {
            for(const coursSection of Object.values(el.sections)) {
                return !result.includes(el);
            }
        });
        return arrayAfterRemove;*/
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
        let mapper = new Map();
        mapper.set("GT", ">");
        mapper.set("LT", "<");
        mapper.set("EQ", "=");
        let sign = mapper.get(comparator);
        let content = this.getData();
        let result: any[] = [];
        content.courses.forEach(function (course: any) {
            course.sections.forEach(function (section: any) {
                if (sign === ">") {
                    if (section[key] > Number(value)) {
                        result.push(section);
                    }
                } else if (sign === "<") {
                    if (section[key] < Number(value)) {
                        result.push(section);
                    }
                } else if (sign === "=") {
                    if (section[key] === Number(value)) {
                        result.push(section);
                    }
                }
            });
        });
        return result;
    }

}
