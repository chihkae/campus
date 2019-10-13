import {InsightError} from "./IInsightFacade";
import InsightFacade, {IQueryValidator} from "./InsightFacade";
export default class QueryValidator implements IQueryValidator {
    private where: string;
    private options: string;
    private columns: string;
    private columnsKey: string[];
    private orderKey: string;
    private idString: string;

    public setWhere(s: string): void {
        if (this.where === undefined && s !== null) {
            this.where = s;
            return;
        }
        throw new InsightError("where never set");
    }

    public setOptions(s: string): void {
        if (this.options === undefined && s !== null) {
            this.options = s;
            return;
        }
        throw new InsightError("options already set");
    }

    public setColumns(s: string): void {
        if (this.columns === undefined && s !== null) {
            this.columns = s;
            return;
        }
        throw new InsightError("columns can not be set again");
    }

    public setColumnsKey(s: string[]): void {
        if (s !== null && this.columnsKey === undefined) {
            this.columnsKey = [];
            for (const val of s) {
                let id = val.split("_")[0];
                this.setIdString(id);
                this.columnsKey.push(val);
            }
            return;
        }
        throw new InsightError("columns key already set ");
    }

    public getColumnsKey(): string[] {
        return this.columnsKey;
    }

    public getColumnsKeyWithoutUnderscore(): string[] {
        if (this.getColumnsKey()) {
            let columnsWithotUndescore = [];
            for (const val of this.getColumnsKey()) {
                columnsWithotUndescore.push(val.split("_")[1]);
            }
            return columnsWithotUndescore;
        }
    }

    public getOrderKeyWithoutUnderscore(): string {
        if (this.getOrderKey()) {
            let orderKey = this.getOrderKey();
            return orderKey.split("_")[1];
        }
    }

    public setOrderKey(s: string): void {
        if (this.orderKey === undefined && s !== null) {
            let id = s.split("_")[0];
            this.setIdString(id);
            this.orderKey = s;
            return;
        }
        throw new InsightError("two order keys");
    }

    public getOrderKey(): string {
        return this.orderKey;
    }

    public setIdString(s: string): void {
        if (s !== null && this.idString === undefined) {
            this.idString = s;
        } else if (this.idString.valueOf() !== s.toString().valueOf()) {
            throw new InsightError("two different id's in query, should only have one dataset id in query");
        }
    }

    public getIdString(): string {
        return this.idString;
    }

    public checkKeys(where: boolean, options: boolean, columnsKey: boolean, orderKey: boolean): void {
        if (where && !options && !columnsKey && !orderKey) {
            if (typeof this.where === undefined) {
                throw new InsightError();
            }
        } else if (where && options && !columnsKey && !orderKey) {
            if (typeof this.options === undefined || typeof this.where === undefined) {
                throw new InsightError();
            }
        } else if (columnsKey && options && where && !orderKey) {
            if (typeof this.options === undefined || typeof this.where === undefined
                || typeof this.columnsKey === undefined) {
                throw new InsightError();
            }
        } else if (columnsKey && options && where && orderKey) {
            if (typeof this.options === undefined || typeof this.where === undefined
                || typeof this.columnsKey === undefined || typeof  this.orderKey === undefined) {
                throw new InsightError();
            }
        }
    }

    public validateQuery(query: any): boolean {
        if (query != null && typeof query === "object") {
                for (const key of Object.keys(query)) {
                    if (key === "WHERE") {
                        this.setWhere(query[key].toString());
                        this.validateQuery(query[key]);
                    } else if (key === "IS") {
                        this.checkKeys(true, false, false, false);
                        this.validateIS(query[key]);
                    } else if (key === "NOT") {
                        this.checkKeys(true, false, false, false);
                        this.validateNot(query[key]);
                        this.validateQuery(query[key]);
                    } else if (key === "GT" || key === "LT" || key === "EQ") {
                        this.checkKeys(true, false, false, false);
                        this.validateCompare(query[key]);
                    } else if (key === "OR" || key === "AND") {
                        this.checkKeys(true, false, false, false);
                        this.validateQueryWithArray(query[key]);
                    } else if (key === "OPTIONS") {
                        this.setOptions(query[key].toString());
                        this.checkKeys(true, true, false, false);
                        this.validateQuery(query[key]);
                    } else if (key === "COLUMNS") {
                        this.setColumns(query[key].toString());
                        this.validateColumnsArray(query[key]);
                        this.checkKeys(true, true, true, false);
                    } else if (key === "ORDER") {
                        this.validateOrderKey(query[key]);
                        this.setOrderKey(query[key]);
                        this.checkKeys(true, true, true, true);
                    } else {
                        throw new InsightError();
                    }
                }
                return true;
        }
        return false;
    }

    private validateNot(notObject: any) {
        if (Object.keys(notObject).length === 0) {
            throw new InsightError();
        }
    }

    private validateOrderKey(orderKey: any) {
        let columnsKey: string[] = this.getColumnsKey();
        let matchesColumnskey = false;
        if (orderKey === "") {
            throw new InsightError("No order key");
        }
        if (columnsKey !== null) {
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
            if (query != null && typeof query === "object") {
                let columnsKey: string[] = [];
                for (const value of Object.values(query)) {
                    this.validateKey(value, "either");
                    columnsKey.push(value.toString());
                }
                this.setColumnsKey(columnsKey);
            } else {
                throw new InsightError("columns array not an object");
            }
        } else {
            throw new InsightError("columns not an array");
        }
    }

    private validateQueryWithArray(query: any) {
        if (Array.isArray(query)) {
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
