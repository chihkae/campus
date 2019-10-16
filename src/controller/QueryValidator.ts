import {InsightError} from "./IInsightFacade";
import InsightFacade, {IQueryValidator} from "./InsightFacade";
import Query from "./Query";
import * as util from "util";
import {Logger} from "tslint/lib/runner";


export default class QueryValidator extends Query implements IQueryValidator {
    private query: Query = new Query();

    public getQuery() {
        return this.query;
    }

    public checkKeys(where: boolean, options: boolean, columnsKey: boolean, orderKey: boolean): void {
        if (where && !options && !columnsKey && !orderKey) {
            if (typeof this.query.getWhere() === "undefined" || typeof this.query.getOrderKey() !== "undefined" ||
            typeof  this.query.getColumnsKey() !== "undefined" || typeof  this.query.getOptions() !== "undefined") {
                throw new InsightError();
            }
        } else if (where && options && !columnsKey && !orderKey) {
            if (typeof this.query.getOptions() === "undefined" || typeof this.query.getWhere() === "undefined" ||
            typeof  this.query.getColumnsKey() !== "undefined" || typeof this.query.getOrderKey() !== "undefined") {
                throw new InsightError();
            }
        } else if (columnsKey && options && where && !orderKey) {
            if (typeof this.query.getOptions() === "undefined" || typeof this.query.getWhere() === "undefined"
                || typeof this.query.getColumnsKey() === "undefined"
                || typeof this.query.getOrderKey() !== "undefined") {
                throw new InsightError();
            }
        } else if (columnsKey && options && where && orderKey) {
            if (typeof this.query.getOptions() === "undefined" || typeof this.query.getWhere() === "undefined"
                || typeof this.query.getColumnsKey() === "undefined"
                || typeof  this.query.getOrderKey() === "undefined") {
                throw new InsightError();
            }
        }
    }

    public validateQuery(query: any): boolean {
        if (query != null && typeof query === "object") {
                for (const key of Object.keys(query)) {
                    if (key === "WHERE") {
                        this.checkKeys(false, false, false, false);
                        this.query.setWhere(query[key].toString());
                        this.checkKeys(true, false, false, false);
                        this.validateQuery(query[key]);
                    } else if (key === "IS") {
                        this.checkKeys(true, false, false, false);
                        this.validateIS(query[key]);
                        this.checkKeys(true, false, false, false);
                    } else if (key === "NOT") {
                        this.checkKeys(true, false, false, false);
                        this.validateNot(query[key]);
                        this.checkKeys(true, false, false, false);
                        this.validateQuery(query[key]);
                    } else if (key === "GT" || key === "LT" || key === "EQ") {
                        this.checkKeys(true, false, false, false);
                        this.validateCompare(query[key]);
                        this.checkKeys(true, false, false, false);
                    } else if (key === "OR" || key === "AND") {
                        this.checkKeys(true, false, false, false);
                        this.validateQueryWithArray(query[key]);
                        this.checkKeys(true, false, false, false);
                    } else if (key === "OPTIONS") {
                        this.checkKeys(true, false, false, false);
                        this.query.setOptions(query[key].toString());
                        this.checkKeys(true, true, false, false);
                        this.validateQuery(query[key]);
                    } else if (key === "COLUMNS") {
                        this.checkKeys(true , true, false, false);
                        this.query.setColumns(query[key].toString());
                        this.validateColumnsArray(query[key]);
                        this.checkKeys(true, true, true, false);
                    } else if (key === "ORDER") {
                        this.checkKeys(true, true, true, false);
                        this.validateOrderKey(query[key]);
                        this.checkKeys(true, true, true, false);
                        this.query.setOrderKey(query[key]);
                        this.checkKeys(true, true, true, true);
                    } else {
                        throw new InsightError();
                    }
                }
                return true;
        }
        throw new InsightError();
    }

    private validateNot(notObject: any) {
        if (Object.keys(notObject).length !== 1) {
            throw new InsightError();
        }
    }

    private validateOrderKey(orderKey: any) {
        let columnsKey: string[] = this.query.getColumnsKey();
        let matchesColumnskey = false;
        if (orderKey === "" || Object.entries(orderKey).length === 0) {
            throw new InsightError("No order key");
        }
        if (columnsKey !== undefined) {
            for (const val of Object.values(columnsKey)) {
                if (val === orderKey) {
                    matchesColumnskey = true;
                    break;
                }
            }
            if (!matchesColumnskey) {
                throw new InsightError("order string does not equal column key");
            }
        } else {
            throw new InsightError("No column strings exist");
        }
    }

    private validateColumnsArray(query: any) {
        if (Array.isArray(query)) {
            if (query.length === 0) {
                throw new InsightError();
            }
            if (query != null && typeof query === "object") {
                let columnsKey: string[] = [];
                for (const value of Object.values(query)) {
                    this.validateKey(value, "either");
                    columnsKey.push(value.toString());
                }
                this.query.setColumnsKey(columnsKey);
            } else {
                throw new InsightError("columns array not an object");
            }
        } else {
            throw new InsightError("columns not an array");
        }
    }

    private validateQueryWithArray(query: any) {
        if (Array.isArray(query)) {
            if (query.length === 0) {
                throw new InsightError();
            }
            if (query != null && typeof query === "object") {
                for (const key of Object.keys(query)) {
                    if (Object.keys(query[Number(key)]).length === 0) {
                        throw new InsightError();
                    }
                }
                for (const value of Object.values(query)) {
                    if (Object.keys(value).length !== 1) {
                        throw new InsightError();
                    }
                    this.validateQuery(value);
                }
            }
        } else {
            throw new InsightError("sub query not an array");
        }
    }

    private validateIS(query: any): void {
        if (Object.keys(query).length > 1 || Object.values(query).length > 1) {
            throw new InsightError("no keys/value in IS");
        }
        let key = Object.keys(query);
        let value = Object.values(query);
        this.validateInputString(value[0]);
        this.validateKey(key[0], "sKey");
    }

    private validateInputString(inpustring: any): void {
        if (typeof inpustring !== "string") {
            throw new InsightError();
        }
        let asterikOccurences = inpustring.split("*").length - 1;
        if (asterikOccurences > 2) {
            throw new InsightError();
        } else if (asterikOccurences === 2) {
            if (!(inpustring.toString().startsWith("*") && inpustring.toString().endsWith("*"))) {
                throw new InsightError();
            }
        } else if (asterikOccurences === 1) {
            if (!(inpustring.toString().startsWith("*") || inpustring.toString().endsWith("*"))) {
                throw new InsightError();
            }
        }
    }

    private validateKey(key: string, type: string): void {
        if (key !== null || key !== undefined) {
            let id = key.substring(0, key.indexOf("_"));
            let field = key.substring(key.indexOf("_") + 1);
            let mFields = ["avg", "pass", "fail", "audit", "year"];
            let sFields = ["dept", "id", "instructor", "title", "uuid"];
            this.isIDinListofIDs(id);
            if (type === "mKey") {
                if (!(mFields.indexOf(field) > -1)) {
                    throw new InsightError();
                }
            } else if (type === "sKey") {
                if (!(sFields.indexOf(field) > -1)) {
                    throw new InsightError();
                }
            } else if (type === "either") {
                if ( !(mFields.indexOf(field) > -1) && !(sFields.indexOf(field) > -1 )) {
                    throw new InsightError();
                }
            }
        } else {
            throw new InsightError();
        }
    }

    private isIDinListofIDs(id: any): void {
        let fs = require("fs");
        let currentDataFiles: string[] = fs.readdirSync("./data/");
        if (!(currentDataFiles.indexOf(id) > -1)) {
            throw new InsightError();
        }
    }

    private validateNumber(num: any): void {
      if (typeof num !== "number") {
          throw new InsightError();
      }
    }

    private validateCompare(query: any) {
        if (Object.keys(query).length > 1 || Object.values(query).length > 1) {
            throw new InsightError("no key value pair in Compare object");
        }
        const key = Object.keys(query);
        const value = Object.values(query);
        this.validateKey(key[0], "mKey");
        this.validateNumber(value[0]);
    }
}
