import {InsightError} from "./IInsightFacade";
import InsightFacade, {IQueryValidator} from "./InsightFacade";
export default class QueryValidator implements IQueryValidator {
    private where: string;
    private options: string;
    private order: string;
    private columns: string;
    private columnsKey: string[];
    private orderKey: string;
    private idString: string;
    public setWhere(s: string): void {
        if (this.where === undefined && s !== null) {
            this.where = s;
        } else {
            throw new InsightError("where never set");
        }
    }
    public whereSet(): boolean {
        if (typeof this.where === undefined) {
            return false;
        }
        return true;
    }
    public whereSetError(): void {
        if (typeof this.where === undefined) {
            throw new InsightError("where is not set");
        }
        return;
    }
    public setOptions(s: string): void {
        if (this.options === undefined && s !== null) {
            this.options = s;
        } else {
            throw new InsightError("options already set");
        }
    }
    public optionsSet(): boolean {
        if (typeof this.options === undefined) {
            return false;
        }
        return true;
    }
    public setColumns(s: string): void {
        if (this.columns === undefined && s !== null) {
            this.columns = s;
        } else {
            throw new InsightError("columns can not be set again");
        }
    }
    public columnsSet(): boolean {
        if (typeof this.columns === undefined) {
            return false;
        }
        return true;
    }
    public setColumnsKey(s: string[]): void {
        if (s !== null && this.columnsKey === undefined) {
            this.columnsKey = [];
            for (const val of s) {
                let id = val.split("_")[0];
                this.setIdString(id);
                this.columnsKey.push(val);
            }
        } else {
            throw new InsightError("columns key already set ");
        }
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
            let orderKeyWithoutUnderscore = orderKey.split("_")[1];
            return orderKeyWithoutUnderscore;
        }
    }
    public setOrderKey(s: string): void {
        if (this.orderKey === undefined && s !== null) {
            let id = s.split("_")[0];
            this.setIdString(id);
            this.orderKey = s;
        } else {
            throw new InsightError("two order keys");
        }
    }
    public getOrderKey(): string {
        return this.orderKey;
    }
    public orderKeySet(): boolean {
        if (this.orderKey === undefined) {
            return false;
        }
        return true;
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
    public validateAllQueryPartsExist(): void {
        if (this.whereSet() && this.columnsSet() && this.orderKeySet()) {
            return;
        } else {
            throw new InsightError("where/columns/order not set");
        }
    }
    public validateQuery(query: any): boolean {
        if (query != null && typeof query === "object") {
            try {
                /*if (query.length !== Object.keys(query).length){
                    throw new InsightError();
                }*/
                for (const key of Object.keys(query)) {
                    if (key === "WHERE") {
                        this.setWhere(query[key].toString());
                        this.validateQuery(query[key]);
                    } else if (key === "IS") {
                        this.whereSetError();
                        this.validateIS(query[key]);
                    } else if (key === "NOT") {
                        this.whereSetError();
                        this.validateNot(query[key]);
                        this.validateQuery(query[key]);
                    } else if (key === "GT" || key === "LT" || key === "EQ") {
                        this.whereSetError();
                        this.validateCompare(query[key]);
                    } else if (key === "OR" || key === "AND") {
                        this.whereSetError();
                        this.validateQueryWithArray(query[key]);
                    } else if (key === "OPTIONS") {
                        this.whereSetError();
                        this.setOptions(query[key].toString());
                        this.validateQuery(query[key]);
                    } else if (key === "COLUMNS") {
                        if (this.whereSet() && this.optionsSet()) {
                            this.setColumns(query[key].toString());
                            this.validateColumnsArray(query[key]);
                        } else {
                            throw new InsightError("Columns key set before where and options");
                        }
                    } else if (key === "ORDER") {
                        if (!this.whereSet() || !this.columnsSet() || !this.optionsSet()) {
                            throw new InsightError("Order key without where/columns/options existing");
                        } else {
                            this.setOrderKey(query[key]);
                            this.validateOrderKey(query[key]);
                        }
                    }
                }
            } catch (e) {
                throw new Error(e.toString());
            }
            return true;
        }
        return false;
    }
    private validateNot(notObject: any){
        if (Object.keys(notObject).length === 0 ) {
            throw new InsightError();
        }
    }
    private validateOrderKey(orderKey: any) {
        let columnsKey: string[] = this.getColumnsKey();
        let matchesColumnskey = false;
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
                for (const key of Object.keys(query)){
                    if (Object.keys(query[Number(key)]).length === 0) {
                        throw new InsightError();
                    }
                }
                for (const value of Object.values(query)) {
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
        } else {
            let key = Object.keys(query);
            let value = Object.values(query);
            if ( !(this.validateInputString(value[0])) || !(this.validateSkey(key[0]))) {
                throw new InsightError();
            }
        }
    }

    private validateInputString(inpustring: any): boolean {
        let asterikOccurences = inpustring.split("*").length - 1 ;
        let inpustringWithoutAsterik;
        if (asterikOccurences > 2 || (typeof inpustring !== "string")) {
            throw new InsightError();
        } else if (asterikOccurences === 2) {
            inpustringWithoutAsterik = inpustring.toString().substring(1, inpustring.toString().length - 1);
        } else if (asterikOccurences === 1) {
            if (inpustring.toString().indexOf("*") === 0){
                inpustringWithoutAsterik = inpustring.toString().substring(1, inpustring.toString().length);
            } else if (inpustring.toString().indexOf("*") === inpustring.toString().length - 1){
                inpustringWithoutAsterik = inpustring.toString().substring(0, inpustring.toString().length - 1);
            } else {
                throw new InsightError();
            }
        }
        if (inpustringWithoutAsterik !== undefined) {
            if (asterikOccurences > 2 || inpustringWithoutAsterik.includes("*")) {
                throw new InsightError("more than 2 wildcards");
            } else if (asterikOccurences > 0 && asterikOccurences < 2) {
                if (inpustringWithoutAsterik.toString().indexOf("*") > 0) {
                    throw new InsightError("asteriks wrong");
                }
            }
        }
        return true;
      /*  let re = /^[*]?[^*]*[*]?/g;
        if (re.test(inpustring)) {
            return true;
        }
        throw new InsightError("inputstring has asterik");*/
    }
    private validateMKey(mKey: string): boolean {
        if(mKey !== null || mKey !== undefined){
            let indexofUnderscore = mKey.indexOf("_");
            let id = mKey.substr(0, indexofUnderscore);
            let mfield = mKey.substr(indexofUnderscore + 1);
            if (!this.isIDinListofIDs(id)){
                throw new InsightError("id not in list of id's of currently added datasets");
            } else {
                let mFields = ["avg", "pass", "fail", "audit", "year"];
                if (!(mFields.indexOf(mfield) > -1)) {
                    return false;
                }
                return true;
            }
        }
        /*let re = /[^_]+_(avg|pass|fail|audit|year)/g;
        if (re.test(mKey)) {
            let id = mKey.split("_")[0];
            this.setIdString(id);
            if (!this.isIDinListofIDs(id)) {
                throw new InsightError("dataset of id in mkey has not been added");
            }
            return true;
        } else {
            return false;
        }*/
    }
    private isIDinListofIDs(id: any): boolean {
        let fs = require("fs");
        let currentDataFiles: string[] = fs.readdirSync("./data/");
        if (currentDataFiles.indexOf(id) > -1) {
            return true;
        } else {
            return false;
        }
    }

    private validateSkey(sKey: string): boolean {
        if(sKey !== null || sKey !== undefined){
            let indexofUnderscore = sKey.indexOf("_");
            let id = sKey.substr(0, indexofUnderscore);
            let sfield = sKey.substr(indexofUnderscore + 1);
            if (!this.isIDinListofIDs(id)){
                throw new InsightError("id not in list of id's of currently added datasets");
            } else {
                let sFields = ["dept","id", "instructor","title", "uuid"];
                if (!(sFields.indexOf(sfield) > -1)){
                    return false;
                }
                return true;
            }
        }
        /*let re = /[^_]+_(dept|id|instructor|title|uuid)/g;
        if (re.test(sKey)) {
            let id = sKey.split("_")[0];
            this.setIdString(id);
            if (!this.isIDinListofIDs(id)) {
                throw new InsightError("Id in skey not part of added datasets");
            }
            return true;
        } else {
            return false;
        }*/
    }
    private validateNumber(num: any): boolean {
        let re = /^[0-9]+$/g;
        if (!re.test(num) || (typeof num === "string")) {
            throw InsightError;
        } else {
            return true;
        }
    }
    private validateCompare(query: any) {
        if (Object.keys(query).length > 1 || Object.values(query).length > 1) {
            throw new InsightError("no key value pair in Compare object");
        } else {
            const key = Object.keys(query);
            const value = Object.values(query);
            if(!this.validateMKey(key[0]) || !this.validateNumber(value[0])){
                throw new InsightError();
            }
        }
    }
}
