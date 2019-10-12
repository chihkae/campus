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
                    if (!this.validateMKey(value) && !this.validateSkey(value)) {
                        throw new InsightError("Mkey or Skey not valid");
                    }
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
        if (!(this.validateInputString(value[0])) || !(this.validateSkey(key[0]))) {
            throw new InsightError();
        }
    }
    private validateInputString(inpustring: any): boolean {
        if (typeof inpustring !== "string") {
            throw new InsightError();
        }
        let asterikOccurences = inpustring.split("*").length - 1;
        let inpustringWithoutAsterik;
        if (asterikOccurences > 2 || (typeof inpustring !== "string")) {
            throw new InsightError();
        } else if (asterikOccurences === 2) {
            inpustringWithoutAsterik = inpustring.toString().substring(1, inpustring.toString().length - 1);
        } else if (asterikOccurences === 1) {
            if (inpustring.toString().indexOf("*") === 0) {
                inpustringWithoutAsterik = inpustring.toString().substring(1, inpustring.toString().length);
            } else if (inpustring.toString().indexOf("*") === inpustring.toString().length - 1) {
                inpustringWithoutAsterik = inpustring.toString().substring(0, inpustring.toString().length - 1);
            } else {
                throw new InsightError();
            }
        }
        if (inpustringWithoutAsterik !== undefined) {
            if (asterikOccurences > 2 || inpustringWithoutAsterik.includes("*")) {
                throw new InsightError("more than 2 wildcards");
            } else if (asterikOccurences > 0 && asterikOccurences < 3) {
                if (inpustringWithoutAsterik.toString().indexOf("*") > -1) {
                    throw new InsightError("asteriks wrong");
                }
            }
        }
        return true;
    }
    private validateMKey(mKey: string): boolean {
        if (mKey !== null || mKey !== undefined) {
            let id = mKey.substring(0, mKey.indexOf("_"));
            let mfield = mKey.substring(mKey.indexOf("_") + 1);
            this.isIDinListofIDs(id);
            let mFields = ["avg", "pass", "fail", "audit", "year"];
            if (!(mFields.indexOf(mfield) > -1)) {
                return false;
            }
            return true;
        }
    }
    private isIDinListofIDs(id: any): void {
        let fs = require("fs");
        let currentDataFiles: string[] = fs.readdirSync("./data/");
        if (!(currentDataFiles.indexOf(id) > -1)) {
            throw new InsightError();
        }
    }
    private validateSkey(sKey: string): boolean {
        if (sKey !== null || sKey !== undefined) {
            let indexofUnderscore = sKey.indexOf("_");
            let id = sKey.substr(0, indexofUnderscore);
            let sfield = sKey.substr(indexofUnderscore + 1);
            this.isIDinListofIDs(id);
            let sFields = ["dept", "id", "instructor", "title", "uuid"];
            if (!(sFields.indexOf(sfield) > -1)) {
                return false;
            }
            return true;
        }
    }
    private validateNumber(num: any): boolean {
        let re = /^[0-9]+$/g;
        if (!re.test(num) || (typeof num === "string")) {
            throw InsightError;
        }
        return true;
    }
    private validateCompare(query: any) {
        if (Object.keys(query).length > 1 || Object.values(query).length > 1) {
            throw new InsightError("no key value pair in Compare object");
        }
        const key = Object.keys(query);
        const value = Object.values(query);
        if (typeof value[0] !== "number") {
            throw new InsightError();
        }
        if (!this.validateMKey(key[0]) || !this.validateNumber(value[0])) {
            throw new InsightError();
        }
    }
}
