import {InsightError} from "./IInsightFacade";
import {IQuery} from "./InsightFacade";
import {QueryValidator} from "./QueryValidator";

export class Query implements IQuery {
    private where: string;
    private options: string;
    private columns: string;
    private columnsKey: string[];
    private orderKey: string[];
    private idString: string;
    private transformations: string;
    private group: string[];
    private applyRulesTokenKey: IApplyRule[];
    private applyKeys: any[];
    private groupKeys: string[];
    private dir: string;

    public setDir(s: any): void {
        if (typeof s !== "string") {
            throw new InsightError();
        }
        if (this.dir === undefined) {
            this.dir = s;
        } else {
            throw new InsightError();
        }
    }

    public getDir(): string {
        return this.dir;
    }

    public setGroup(s: any[]): void {
        if (this.group === undefined) {
            let values = Object.values(s);
            this.group = new Array(values[0]);
            return;
        }
        throw new InsightError();
    }

    public setApplyKeys(s: any): void {
        if (this.applyKeys === undefined) {
            this.applyKeys = [];
        }
        this.applyKeys.push(s);
    }

    public getApplyKeys(): any[] {
           return this.applyKeys;
    }

    public setApplyRulesTokenKey(s: any): void {
        if (this.applyRulesTokenKey === undefined) {
            this.applyRulesTokenKey = [];
            for (const val of Object.values(s)) {
                let applyRule = {} as IApplyRule;
                applyRule.applyKey = Object.keys(val).toString();
                for (const value of Object.values(val)) {
                    if (Object.keys(value).length !== 1 && Object.values(value).length !== 1) {
                        throw new InsightError();
                    }
                    for (const key of Object.keys(value)) {
                        applyRule.applyToken = key.toString();
                    }
                    for (const v of Object.values(value)) {
                        applyRule.key = v.toString();
                    }
                }
                this.applyRulesTokenKey.push(applyRule);
            }
        } else {
            throw new InsightError();
        }
    }

    public getApplyRulesTokenKeys(): IApplyRule[] {
        return this.applyRulesTokenKey;
    }

    public setGroupKeys(s: any[]): void {
        this.groupKeys = s;
    }

    public getGroupKeys(): string[] {
        return this.groupKeys;
    }

    public setTransformations(s: string): void {
        if (this.transformations === undefined) {
            this.transformations = s;
            return;
        }
        throw new InsightError();
    }

    public getTransformations(): string {
        return this.transformations;
    }

    public setWhere(s: string): void {
        if (this.where === undefined) {
            this.where = s;
            return;
        }
        throw new InsightError("where never set");
    }

    public getWhere(): string {
        return this.where;
    }

    public setOptions(s: string): void {
        if (this.options === undefined && s !== null) {
            this.options = s;
            return;
        }
        throw new InsightError("options already set");
    }

    public getOptions(): string {
        return this.options;
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
        if (this.getColumnsKey() !== undefined) {
            let columnsWithotUndescore = [];
            let toAdd;
            for (const val of this.getColumnsKey()) {
                if (val.toString().includes("_")) {
                    toAdd = val.split("_")[1];
                } else {
                    toAdd = val;
                }
                columnsWithotUndescore.push(toAdd);
            }
            return columnsWithotUndescore;
        }
    }

    private withoutUnderscoreInArray(s: any): any[] {
        let withoutUnderscore = [];
        let toAdd;
        for (const val of s) {
            if (val.toString().includes("_")) {
                toAdd = val.split("_")[1];
            } else {
                toAdd = val;
            }
            withoutUnderscore.push(toAdd);
        }
        return withoutUnderscore;
    }

    public getGroupsWithoutUnderscore(): string[] {
        if (this.getGroupKeys() !== undefined) {
            return this.withoutUnderscoreInArray(this.getGroupKeys());
        } else {
            return undefined;
        }
    }

    public getOrderKeyWithoutUnderscore(): any[] {
        if (this.getOrderKey() !== undefined) {
            let orderKeys = this.getOrderKey();
            let newOrderkeys = [];
            let toAdd;
            for (const val of orderKeys) {
                if (val.toString().includes("_")) {
                    toAdd = val.split("_")[1];
                } else {
                    toAdd = val;
                }
                newOrderkeys.push(toAdd);
            }
            return newOrderkeys;
        }
    }

    public setOrderKey(s: any): void {
        if (this.orderKey === undefined && s !== null) {
            this.orderKey = [];
            if (Array.isArray(s)) {
                // if (Object.values(s).length === 0) {
                //     throw new InsightError();
                // }
                for (const val of Object.values(s)) {
                    this.orderKey.push(val);
                }
            } else {
                this.orderKey.push(s);
            }
            return;
        }
        throw new InsightError("two order keys");
    }

    public getOrderKey(): string[] {
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
}
