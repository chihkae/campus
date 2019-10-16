import {InsightError} from "./IInsightFacade";
import {IQuery} from "./InsightFacade";

export default class Query implements IQuery {
    private where: string = undefined;
    private options: string = undefined;
    private columns: string = undefined;
    private columnsKey: string[] = undefined;
    private orderKey: string = undefined;
    private idString: string = undefined;

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
}
