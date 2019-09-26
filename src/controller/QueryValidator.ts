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
        if(this.order === undefined && s !== null) {
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
                    Log.info("In where");
                    this.setWhere(query[key].toString());
                    this.validateQuery(query[key]);
                } else if (key === "IS") {
                    Log.info("In where");
                    if (!this.whereSet()) {
                        Log.info("where not set");
                        throw new InsightError();
                    } else {
                        Log.info("query key: "+ query[key]);
                        Log.info("validating is key");
                        this.validateIS(query[key]);
                    }
                } else if (key === "NOT") {
                    Log.info("in not");
                    if (!this.whereSet()) {
                        Log.info("where not set");
                        throw InsightError;
                    } else {
                        Log.info("query key: "+ query[key]);
                        Log.info("validating not keys")
                        this.validateQuery(query[key]);
                    }
                } else if (key === "GT" || key === "LT" || key === "EQ") {
                    if (!this.whereSet()) {
                        Log.info("where not set");
                        throw InsightError;
                    } else {
                        Log.info("query key: "+ query[key]);
                        Log.info("comparing GT/LT/EQ keys");
                        this.validateCompare(query[key]);
                    }
                } else if (key === "OR" || key === "AND") {
                    if (!this.whereSet()) {
                        Log.info("where not set");
                        throw InsightError;
                    } else {
                        Log.info("query key: "+ query[key]);
                        Log.info("validating array inside and/or");
                        this.validateQueryWithArray(query[key]);

                    }
                } else if (key === "OPTIONS") {
                    if (!this.whereSet()) {
                        Log.info("where not set");
                        throw InsightError;
                    } else {
                        Log.info("query key: "+ query[key]);
                        Log.info("setting options of query");
                        this.setOptions(query[key].toString());
                        Log.info("validating query options")
                        this.validateQuery(query[key]);
                    }
                } else if (key === "COLUMNS") {
                    if (this.whereSet() && this.optionsSet()) {
                        Log.info("query key: " + query[key]);
                        this.setColumns(query[key].toString());
                        Log.info("setting columns");
                        Log.info("validating columns");
                        this.validateColumnsArray(query[key]);
                        Log.info("finished validating columns array");
                    } else {
                        Log.info("options/where not set");
                        throw InsightError;
                    }
                } else if (key === "ORDER") {
                    if (!this.whereSet() || !this.columnsSet() || !this.optionsSet()) {
                        Log.info("where/columns/options not set");
                        throw InsightError;
                    } else {
                        Log.info("query key: "+ query[key].toString());
                        this.setOrderKey(query[key]);
                        Log.info("validating order key");
                        this.validateOrderKey(query[key]);
                    }
                }
            }
            return true;
            /*let validity = false;
            const allKeyValuePairs = Object.entries(query);
            const queryOrder = ["WHERE", "OPTIONS"];
            let queryOrderCount = 0;
            let hasSeenBody = false;
            let hasSeenOptions = false;
            if (allKeyValuePairs != null && typeof allKeyValuePairs === "object") {
                for (const keyValue of allKeyValuePairs) {
                    if (hasSeenBody) {
                        validity = this.checkOptions(allKeyValuePairs[1]);
                    } else {
                        if (keyValue != null && typeof keyValue === "object") {
                            validity = this.validateQueryWithArray(allKeyValuePairs[0]);
                        }
                    }
                    /!* if (queryOrderCount === 0) {
                         if (!(Object.keys(keyValue).toString() === queryOrder[0])) {
                             validity = false;
                             break;
                         } else {
                             queryOrderCount++;
                         }
                     } else {
                         if (queryOrderCount === 1) {
                             if (!(Object.keys(keyValue).toString() === queryOrder[1])) {
                                 validity = false;
                                 break;
                             } else {
                                 validity = true;
                             }
                         }
                     }
                 }*!/
                }
            } else {
                    validity = false;
            }
            return validity;*/
        }
        return false;
    }

    private validateOrderKey(orderKey: any) {
        let columnsKey: string[] = this.getColumnsKey();
        let matchesColumnskey = false;
        if (columnsKey !== null) {
            for (const val of Object.values(columnsKey)) {
                Log.info("Columns Key: " + val );
                if (val === orderKey) {
                    matchesColumnskey = true;
                    break;
                }
            }
            if (!matchesColumnskey) {
                Log.info("No columns key matched");
                throw InsightError;
            }
        } else {
            throw InsightError;
        }
    }
    private validateColumnsArray(query: any) {
        if (Array.isArray(query)) {
            Log.info("Is Array columns");
            if (query != null && typeof query === "object") {
                let columnsKey: string[] = [];
                for (const value of Object.values(query)) {
                    if (!this.validateMKey(value) && !this.validateSkey(value)) {
                        throw InsightError;
                    }
                    columnsKey.push(value.toString());
                }
                Log.info(columnsKey);
                this.setColumnsKey(columnsKey);
            } else {
                throw InsightError;
            }
        } else {
            Log.info("Is not array columns");
            throw InsightError;
        }
    }

    private validateQueryWithArray(query: any) {
        if (Array.isArray(query)) {
            Log.info("Is array");
            if (query != null && typeof query === "object") {
                for (const value of Object.values(query)) {
                    this.validateQuery(value);
                }
            }
        } else {
            Log.info("is not array");
            throw InsightError;
        }
    }

    private validateIS(query: any): void {
        Log.info("3: " + query);
        if (Object.keys(query).length > 1 || Object.values(query).length > 1 ) {
            throw InsightError;
        } else {
            let key = Object.keys(query);
            Log.info(key);
            let value = Object.values(query);
            Log.info(value);
            this.validateInputString(value[0]);
            this.validateSkey(key[0]);
        }
    }

    private validateInputString(inpustring: any): boolean {
        let re = /^[*]?[^*]*[*]?/g ;
        Log.info(inpustring);
        if (re.test(inpustring)) {
            return true;
        }
        throw InsightError;
    }

    private validateMKey(mKey: string): boolean {
        let re = /[^_]+_(avg|pass|fail|audit|year)/g ;
        Log.info(mKey);
        if (re.test(mKey)) {
            return true;
        } else {
            return false;
        }
    }

    private validateSkey(sKey: string): boolean {
        let re = /[^_]+_(dept|id|instructor|title|uuid)/g;
        Log.info(sKey);
        if (re.test(sKey)) {
            return true;
        } else {
            return false;
        }
    }

    private validateNumber(num: any): void {
        let re = /^[0-9]+$/g;
        Log.info(num);
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
