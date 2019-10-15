import {InsightError} from "./IInsightFacade";
import InsightFacade, {IQueryValidator} from "./InsightFacade";
import Query from "./Query";


export default class QueryValidator implements IQueryValidator {
    private query: Query = new Query();

    public getQuery(): Query {
        return this.query;
    }

    public checkKeys(where: boolean, options: boolean, columnsKey: boolean, orderKey: boolean, transformations: boolean):
        void {
        if (where && !options && !columnsKey && !orderKey) {
            if (typeof this.query.getWhere() === undefined) {
                throw new InsightError();
            }
        } else if (where && options && !columnsKey && !orderKey) {
            if (typeof this.query.getOptions() === undefined || typeof this.query.getWhere() === undefined) {
                throw new InsightError();
            }
        } else if (columnsKey && options && where && !orderKey) {
            if (typeof this.query.getOptions() === undefined || typeof this.query.getWhere() === undefined
                || typeof this.query.getColumnsKey() === undefined) {
                throw new InsightError();
            }
        } else if (columnsKey && options && where && orderKey) {
            if (typeof this.query.getOptions() === undefined || typeof this.query.getWhere() === undefined
                || typeof this.query.getColumnsKey() === undefined || typeof  this.query.getOrderKey() === undefined) {
                throw new InsightError();
            }
        } else if (columnsKey && options && where && orderKey && transformations) {
            if (typeof this.query.getOptions() === undefined || typeof this.query.getWhere() === undefined
                || typeof this.query.getColumnsKey() === undefined || typeof  this.query.getOrderKey() === undefined
            && typeof this.query.getGroupKeys() === undefined && typeof this.query.getApplyKeys() === undefined) {
                throw new InsightError();
            }
        }
    }

    public validateQuery(query: any): boolean {
        if (query != null && typeof query === "object") {
                for (const key of Object.keys(query)) {
                    if (key === "WHERE") {
                        this.query.setWhere(query[key].toString());
                        this.validateQuery(query[key]);
                    } else if (key === "IS") {
                        this.checkKeys(true, false, false, false, false);
                        this.validateIS(query[key]);
                    } else if (key === "NOT") {
                        this.checkKeys(true, false, false, false, false);
                        this.validateNot(query[key]);
                        this.validateQuery(query[key]);
                    } else if (key === "GT" || key === "LT" || key === "EQ") {
                        this.checkKeys(true, false, false, false, false);
                        this.validateCompare(query[key]);
                    } else if (key === "OR" || key === "AND") {
                        this.checkKeys(true, false, false, false, false);
                        this.validateQueryWithArray(query[key]);
                    } else if (key === "OPTIONS") {
                        this.query.setOptions(query[key].toString());
                        this.checkKeys(true, true, false, false, false);
                        this.validateQuery(query[key]);
                    } else if (key === "COLUMNS") {
                        this.query.setColumns(query[key].toString());
                        this.validateColumnsArray(query[key]);
                        this.checkKeys(true, true, true, false, false);
                    } else if (key === "ORDER") {
                        this.validateOrderKey(query[key]);
                        this.checkKeys(true, true, true, true, false);
                    } else if (key === "TRANSFORMATIONS") {
                        this.checkKeys(true, true, true, true, false);
                        this.validateTransformations(query[key]);
                        this.query.setTransformations(query[key]);
                        this.query.setGroup(query[key]);
                        this.query.setApply(query[key]);
                    } else {
                        throw new InsightError();
                    }
                }
                return true;
        }
        return false;
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
        this.query.setGroupKeys(transformation[0]);
        this.validateApplyKey(transformation[1]);
        this.validateColumnsAfterTransformations();
    }

    private validateColumnsAfterTransformations() {
        let allKeys = this.query.getGroupKeys().concat(this.query.getApplyKeys());
        for (const key of this.query.getColumnsKey()) {
            if (allKeys.indexOf(key)) {
                throw new InsightError();
            }
        }
    }

    private validateApplyKey(applyArray: any) {
        if (Array.isArray(applyArray)) {
            throw new InsightError();
        }
        let hasSeen: any[] = [];
        for (const value of Object.values(applyArray)) {
            for (const key of Object.keys(value)) {
                if (hasSeen.indexOf(key) !== -1 || key.toString().includes("_")) {
                    throw new InsightError();
                }
                hasSeen.push(key);
                this.query.setApplyKeys(key);
            }
            for (const val of Object.values(value)) {
                if (Object.keys(val).length !== 1 && Object.values(val).length !== 1) {
                    throw new InsightError();
                }
                let ApplyToken = ["MAX", "MIN" , "AVG" , "COUNT" , "SUM" ];
                if (ApplyToken.indexOf(Object.keys(val)[0]) === -1 ) {
                    throw new InsightError();
                }
                if (! this.validateKey(Object.values(val)[0], "either")) {
                    throw new InsightError();
                }
            }
        }
    }

    private validateNot(notObject: any) {
        if (Object.keys(notObject).length === 0) {
            throw new InsightError();
        }
    }

    private validateOrderWithDirAndMultipleKeys(orderKey: any){
        if (Object.keys(orderKey).length !== 0 ) {
            throw new InsightError();
        }

        let count = 0;
        for (const key of Object.keys(orderKey)) {
            if (count === 0 && key !== "dir") {
                throw new InsightError();
            }
            if (count === 1 && key !== "keys") {
                throw new InsightError();
            }
        }
        count = 0;
        let orderKeyArray;
        let columnsKey: string[] = this.query.getColumnsKey();

        for (const val of Object.values(orderKey)) {
            if (count === 0) {
                if (val !== "UP" || val !== "DOWN") {
                    throw new InsightError();
                } else {
                    this.query.setDir(val);
                }
            }
            if (count === 1) {
                if (! Array.isArray(val)) {
                    throw new InsightError();
                } else {
                    orderKeyArray = val;
                    this.query.setOrderKey(val);
                }
            }
            count++;
        }
        for (const value of Object(orderKeyArray).values) {
            if (columnsKey.indexOf(value) === -1) {
                throw new InsightError();
            }
        }
    }

    private validateOrderKey(orderKey: any) {
        let columnsKey: string[] = this.query.getColumnsKey();

        if (typeof orderKey === "object") {
            this.validateOrderWithDirAndMultipleKeys(orderKey);
        } else if (typeof orderKey === "string") {
            if (orderKey === "") {
                throw new InsightError("No order key");
            }
            if (columnsKey !== undefined) {
                if (columnsKey.indexOf(orderKey) === -1) {
                    throw new InsightError();
                } else {
                    this.query.setOrderKey(orderKey);
                }
            } else {
                throw new InsightError("No column strings exist");
            }
        }
    }

    private validateColumnsArray(query: any) {
        if (Array.isArray(query)) {
            if (query != null && typeof query === "object") {
                let columnsKey: string[] = [];
                for (const value of Object.values(query)) {
                    if ((!this.validateKey(value, "either") && !this.validateKey(value, "applyKey"))) {
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

    public validateKey(key: any, type: string): boolean {
        if (key !== null || key !== undefined || typeof key !== "string") {
            let id = key.substring(0, key.indexOf("_"));
            this.query.setIdString(id);
            let field = key.substring(key.indexOf("_") + 1);
            let mFields = ["avg", "pass", "fail", "audit", "year", "lat" , "lon", "seats"];
            let sFields = ["dept", "id", "instructor", "title", "uuid", "fullname", "shortname", "number", "name",
            "address", "type", "furniture", "href"];
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
                    return false;
                }
                return true;
            } else if (type === "applyKey") {
                if (key.includes("_")) {
                   return false;
                }
                return true;
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
