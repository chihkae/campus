import {InsightError} from "./IInsightFacade";
import InsightFacade, {IQueryValidator} from "./InsightFacade";
import {Query} from "./Query";
import {QueryKeyValidator} from "./QueryKeyValidator";
import {QueryOrderValidator} from "./QueryOrderValidator";

export class QueryValidator implements IQueryValidator {
    private query: Query;
    private queryOrderValidator: QueryOrderValidator = new QueryOrderValidator();
    private queryKeyValidator: QueryKeyValidator = new QueryKeyValidator();

    constructor(query: Query) {
        this.query = new Query();
        this.queryOrderValidator.setQuery(this.query);
        this.queryKeyValidator.setQuery(this.query);
    }

    public getQuery(): Query {
        return this.query;
    }

    public getQueryOrderValidator(): QueryOrderValidator {
        return this.queryOrderValidator;
    }

    public validateQuery(query: any): boolean {
        if (query != null && typeof query === "object") {
                for (const key of Object.keys(query)) {
                    if (key === "WHERE") {
                        this.queryOrderValidator.checkBeforeAnything();
                        this.query.setWhere(query[key].toString());
                        this.queryOrderValidator.checkInsideWhere();
                        this.validateQuery(query[key]);
                    } else if (key === "IS") {
                        this.validateIS(query[key]);
                        this.queryOrderValidator.checkInsideWhere();
                    } else if (key === "NOT") {
                        this.validateNot(query[key]);
                        this.validateQuery(query[key]);
                        this.queryOrderValidator.checkInsideWhere();
                    } else if (key === "GT" || key === "LT" || key === "EQ") {
                        this.validateCompare(query[key]);
                        this.queryOrderValidator.checkInsideWhere();
                    } else if (key === "OR" || key === "AND") {
                        this.validateQueryWithArray(query[key]);
                        this.queryOrderValidator.checkInsideWhere();
                    } else if (key === "OPTIONS") {
                        this.queryOrderValidator.checkInsideWhere();
                        this.query.setOptions(query[key].toString());
                        this.queryOrderValidator.checkAfterOptions();
                        this.validateQuery(query[key]);
                    } else if (key === "COLUMNS") {
                        this.queryOrderValidator.checkAfterOptions();
                        this.query.setColumns(query[key].toString());
                        this.validateColumnsArray(query[key]);
                        this.queryOrderValidator.checkAfterColumns();
                    } else if (key === "ORDER") {
                        this.queryOrderValidator.checkAfterColumns();
                        this.validateOrderKey(query[key]);
                        this.queryOrderValidator.checkAfterOrder();
                    } else if (key === "TRANSFORMATIONS") {
                        this.queryOrderValidator.checkAfterOrder();
                        this.validateTransformations(query[key]);
                        this.query.setTransformations(query[key]);
                        this.query.setApplyRulesTokenKey(query[key]["APPLY"]);
                        this.queryOrderValidator.checkAfterTransformations();
                    } else {
                        throw new InsightError();
                    }
                }
                return true;
        }
        return false;
    }

    private validateNot(notObject: any) {
        if (Object.keys(notObject).length !== 1) {
            throw new InsightError();
        }
    }

    public validateColumnsWithoutTransformations() {
        let columKeys = this.query.getColumnsKey();
        for (const key of Object.values(columKeys)) {
            if (!this.queryKeyValidator.validateKey(key, "either")) {
                throw new InsightError();
            }
        }
    }

    private validateCompare(query: any) {
        if (Object.keys(query).length > 1 || Object.values(query).length > 1) {
            throw new InsightError("no key value pair in Compare object");
        }
        const key = Object.keys(query);
        const value = Object.values(query);
        this.queryKeyValidator.validateKey(key[0], "mKey");
        this.queryKeyValidator.validateNumber(value[0]);
    }

    private validateIS(query: any): void {
        if (Object.keys(query).length > 1 || Object.values(query).length > 1) {
            throw new InsightError("no keys/value in IS");
        }
        let key = Object.keys(query);
        let value = Object.values(query);
        this.queryKeyValidator.validateInputString(value[0]);
        this.queryKeyValidator.validateKey(key[0], "sKey");
    }

    private validateTransformations(transformation: any[]) {
        let keys = Object.keys(transformation);
        if (keys.length !== 2 ) {
            throw new InsightError();
        } else if (keys[0].toString() !== "GROUP") {
            throw new InsightError();
        } else if (keys[1].toString() !== "APPLY") {
            throw new InsightError();
        }
        let group = Object.values(transformation)[0];
        let apply = Object.values(transformation)[1];
        if (this.queryKeyValidator.validateGroupKey(group)) {
            this.query.setGroupKeys(group);
        }
        this.queryKeyValidator.validateApplyKey(apply);
        this.validateColumnsAfterTransformations();
    }

    private validateColumnsAfterTransformations() {
        let allKeys = this.query.getGroupKeys().concat(this.query.getApplyKeys());
        for (const key of this.query.getColumnsKey()) {
            if (allKeys.indexOf(key) === -1) {
                throw new InsightError();
            }
        }
    }

    private validateOrderKey(orderKey: any) {
        if (typeof orderKey === "object") {
            this.queryKeyValidator.validateOrderWithDirAndMultipleKeys(orderKey);
        } else if (typeof orderKey === "string") {
           this.queryKeyValidator.validaSingleOrderKey(orderKey);
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
                    if ((!this.queryKeyValidator.validateKey(value, "either") &&
                        !this.queryKeyValidator.validateKey(value, "applyKey"))) {
                        throw new InsightError();
                    }
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

}
