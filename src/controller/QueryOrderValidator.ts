import {Query} from "./Query";
import {InsightError} from "./IInsightFacade";
import {QueryValidator} from "./QueryValidator";


export class QueryOrderValidator {
    private query: Query = new Query();

    public setQuery(q: Query) {
        this.query = q;
    }

    // public getQuery(): Query {
    //     return this.query;
    // }

    public checkBeforeAnything(): void {
         if (typeof this.query.getWhere() !== "undefined" || typeof this.query.getOrderKey() !== "undefined" ||
            typeof  this.query.getColumnsKey() !== "undefined" || typeof  this.query.getOptions() !== "undefined"
            || typeof  this.query.getApplyKeys() !== "undefined" || typeof this.query.getGroupKeys() !== "undefined"
         || typeof  this.query.getTransformations() !== "undefined") {
            throw new InsightError();
        }
    }

    public checkInsideWhere() {
        if (typeof this.query.getWhere() === "undefined" || typeof this.query.getOrderKey() !== "undefined" ||
            typeof  this.query.getColumnsKey() !== "undefined" || typeof  this.query.getOptions() !== "undefined"
            || typeof  this.query.getApplyKeys() !== "undefined" || typeof this.query.getGroupKeys() !== "undefined"
        || typeof  this.query.getTransformations() !== "undefined") {
            throw new InsightError();
        }
    }

    public checkAfterOptions() {
        if (typeof this.query.getOptions() === "undefined" || typeof this.query.getWhere() === "undefined"
            || typeof this.query.getColumnsKey() !== "undefined"
            || typeof this.query.getOrderKey() !== "undefined" ||
            typeof this.query.getApplyRulesTokenKeys() !== "undefined"
            || typeof  this.query.getGroupKeys() !== "undefined" ||
            typeof  this.query.getTransformations() !== "undefined") {
            throw new InsightError();
        }
    }

    public checkAfterColumns() {
        if (typeof this.query.getOptions() === "undefined" || typeof this.query.getWhere() === "undefined"
            || typeof this.query.getColumnsKey() === "undefined"
            || typeof this.query.getOrderKey() !== "undefined" ||
            typeof this.query.getApplyRulesTokenKeys() !== "undefined"
            || typeof  this.query.getGroupKeys() !== "undefined" ||
            typeof  this.query.getTransformations() !== "undefined") {
            throw new InsightError();
        }
    }

    public checkAfterOrder() {
        if (typeof this.query.getOptions() === "undefined" || typeof this.query.getWhere() === "undefined"
            || typeof this.query.getColumnsKey() === "undefined" || typeof  this.query.getApplyRulesTokenKeys() !==
            "undefined" || typeof this.query.getGroupKeys() !== "undefined" || typeof  this.query.getOrderKey() ===
        "undefined" || typeof  this.query.getTransformations() !== "undefined") {
            throw new InsightError();
        }
    }


    public checkAfterTransformations() {
        if (typeof this.query.getOptions() === "undefined" || typeof this.query.getWhere() === "undefined"
            || typeof this.query.getColumnsKey() === "undefined" || typeof  this.query.getTransformations() ===
            "undefined" || typeof this.query.getGroupKeys() === "undefined" ||
            typeof this.query.getApplyRulesTokenKeys() === "undefined") {
            throw new InsightError();
        }
    }

    public checkAfterGroupKeys() {
        if (typeof this.query.getOptions() === "undefined" || typeof this.query.getWhere() === "undefined"
            || typeof this.query.getColumnsKey() === "undefined" || typeof this.query.getTransformations() ===
            "undefined" || typeof this.query.getGroupKeys() === "undefined" ||
            typeof this.query.getApplyRulesTokenKeys() !== "undefined") {
            throw new InsightError();
        }
    }

    public checkAfterApplyKeys() {
        if (typeof this.query.getOptions() === "undefined" || typeof this.query.getWhere() === "undefined"
            || typeof this.query.getColumnsKey() === "undefined" || typeof  this.query.getTransformations() ===
            "undefined" || typeof this.query.getGroupKeys() === "undefined" ||
            typeof this.query.getApplyRulesTokenKeys() === "undefined") {
            throw new InsightError();
        }
    }

    public checkMinRequirements(qValidatator: QueryValidator) {
        if (this.query.getTransformations() === undefined) {
            qValidatator.validateColumnsWithoutTransformations();
        }
        if (typeof this.query.getOptions() === "undefined" || typeof this.query.getWhere() === "undefined"
            || typeof this.query.getColumnsKey() === "undefined") {
            throw new InsightError();
        }
    }
}

