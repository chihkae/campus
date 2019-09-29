import {InsightError} from "./IInsightFacade";
import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {IQueryValidator} from "./InsightFacade";

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
            throw InsightError;
        }
    }

    public whereSet(): boolean {
        if (typeof this.where === "undefined") {
            return false;
        }
        return true;
    }

    public setOrder(s: string): void {
        if (this.order === undefined && s !== null) {
            this.order = s;
        } else {
            throw InsightError;
        }
    }

    public orderSet(): boolean {
        if (typeof this.order === undefined) {
            return false;
        }
        return true;
    }

    public setOptions(s: string): void {
        if (this.options === undefined && s !== null) {
            this.options = s;
        } else {
            throw InsightError;
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
            throw InsightError;
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
                this.columnsKey.push(val);
            }
        } else {
            throw InsightError;
        }
    }

    public getColumnsKey(): string[] {
        return this.columnsKey;
    }

    public getColumnsKeyWithoutUnderscore(): string[] {
        if(this.getColumnsKey()){
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

    public ColumnsKeySet(): boolean {
        if (this.columnsKey === undefined) {
            return false;
        }
        return true;
    }

    public setOrderKey(s: string): void {
        if (this.orderKey === undefined && s !== null) {
            this.orderKey = s;
        } else {
            throw InsightError;
        }
    }

    public getOrderKey(): string {
        return this.orderKey;
    }

    public orderKeySet(s: string): boolean {
        if (this.orderKey === undefined) {
            return false;
        }
        return true;
    }

    public setIdString(s: string): void {
        if (s !== null && this.idString === undefined) {
            this.idString = s;
        } else {
            throw InsightError;
        }
    }

    public getIdString(): string {
        return this.idString;
    }

    public IdStringSet(): boolean {
        if (this.idString === undefined) {
            return true;
        }
        return false;
    }

    public validateAllQueryPartsExist(): boolean {
        if (this.whereSet() && this.columnsSet() && this.optionsSet()) {
            return true;
        }
        throw InsightError;
    }

    public validateQuery(query: any): boolean {
        if (query != null && typeof query === "object") {
            for (const key of Object.keys(query)) {
                Log.info(key);
                if (key === "WHERE") {
                    this.setWhere(query[key].toString());
                    this.validateQuery(query[key]);
                } else if (key === "IS") {
                    Log.info("In where");
                    if (!this.whereSet()) {
                        throw new InsightError();
                    } else {
                        this.validateIS(query[key]);
                    }
                } else if (key === "NOT") {
                    if (!this.whereSet()) {
                        throw InsightError;
                    } else {
                        this.validateQuery(query[key]);
                    }
                } else if (key === "GT" || key === "LT" || key === "EQ") {
                    if (!this.whereSet()) {
                        throw InsightError;
                    } else {
                        this.validateCompare(query[key]);
                    }
                } else if (key === "OR" || key === "AND") {
                    if (!this.whereSet()) {
                        throw InsightError;
                    } else {
                        this.validateQueryWithArray(query[key]);

                    }
                } else if (key === "OPTIONS") {
                    if (!this.whereSet()) {
                        throw InsightError;
                    } else {
                        this.setOptions(query[key].toString());
                        this.validateQuery(query[key]);
                    }
                } else if (key === "COLUMNS") {
                    if (this.whereSet() && this.optionsSet()) {
                        this.setColumns(query[key].toString());
                        this.validateColumnsArray(query[key]);
                    } else {
                        throw InsightError;
                    }
                } else if (key === "ORDER") {
                    if (!this.whereSet() || !this.columnsSet() || !this.optionsSet()) {
                        throw InsightError;
                    } else {
                        this.setOrderKey(query[key]);
                        this.validateOrderKey(query[key]);
                    }
                }
            }
            return true;
        }
        return false;
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
                throw InsightError;
            }
        } else {
            throw InsightError;
        }
    }

    private validateColumnsArray(query: any) {
        if (Array.isArray(query)) {
            if (query != null && typeof query === "object") {
                let columnsKey: string[] = [];
                for (const value of Object.values(query)) {
                    if (!this.validateMKey(value) && !this.validateSkey(value)) {
                        throw InsightError;
                    }
                    columnsKey.push(value.toString());
                }
                this.setColumnsKey(columnsKey);
            } else {
                throw InsightError;
            }
        } else {
            throw InsightError;
        }
    }

    private validateQueryWithArray(query: any) {
        if (Array.isArray(query)) {
            if (query != null && typeof query === "object") {
                for (const value of Object.values(query)) {
                    this.validateQuery(value);
                }
            }
        } else {
            throw InsightError;
        }
    }

    private validateIS(query: any): void {
        if (Object.keys(query).length > 1 || Object.values(query).length > 1) {
            throw InsightError;
        } else {
            let key = Object.keys(query);
            let value = Object.values(query);
            this.validateInputString(value[0]);
            this.validateSkey(key[0]);
        }
    }

    private validateInputString(inpustring: any): boolean {
        let re = /^[*]?[^*]*[*]?/g;
        if (re.test(inpustring)) {
            return true;
        }
        throw InsightError;
    }

    private validateMKey(mKey: string): boolean {
        let re = /[^_]+_(avg|pass|fail|audit|year)/g;
        if (re.test(mKey)) {
            return true;
        } else {
            return false;
        }
    }

    private validateSkey(sKey: string): boolean {
        let re = /[^_]+_(dept|id|instructor|title|uuid)/g;
        if (re.test(sKey)) {
            return true;
        } else {
            return false;
        }
    }

    private validateNumber(num: any): void {
        let re = /^[0-9]+$/g;
        if (re.test(num)) {
            return;
        } else {
            throw InsightError;
        }
    }
    private validateCompare(query: any) {
        if (Object.keys(query).length > 1 || Object.values(query).length > 1) {
            throw InsightError;
        } else {
            const key = Object.keys(query);
            const value = Object.values(query);
            this.validateMKey(key[0]);
            this.validateNumber(value[0]);
        }
    }
}
