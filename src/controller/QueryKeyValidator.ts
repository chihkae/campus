import {Query} from "./Query";
import {InsightError} from "./IInsightFacade";
import {Formatter} from "./Formatter";

export class QueryKeyValidator {
    private query: Query;
    private kind: any;

   public setQuery(q: Query) {
       this.query = q;
    }

    public validateGroupKey(groupKey: any[]): boolean {
        if (!Array.isArray(groupKey) || Object.values(groupKey).length === 0) {
            throw new InsightError();
        }
        for (const val of Object.values(groupKey)) {
            if (! this.validateKey(val, "either")) {
                throw new InsightError();
            }
        }
        return true;
    }

    public validaSingleOrderKey(orderKey: any) {
        let columnsKey: string[] = this.query.getColumnsKey();

        if (orderKey === "" || Object.entries(orderKey).length === 0) {
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

    public validateOrderWithDirAndMultipleKeys(orderKey: any) {
        if (Object.keys(orderKey).length !== 2 ) {
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
            count++;
        }
        count = 0;
        let orderKeyArray;
        let columnsKey: string[] = this.query.getColumnsKey();

        for (const val of Object.values(orderKey)) {
            if (count === 0) {
                if (val !== "UP" && val !== "DOWN") {
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
        for (const value of Object.values(orderKeyArray)) {
            if (columnsKey.indexOf(value) === -1) {
                throw new InsightError();
            }
        }
    }

    public validateOrderKey(orderKey: any) {
        let columnsKey: string[] = this.query.getColumnsKey();

        if (typeof orderKey === "object") {
            this.validateOrderWithDirAndMultipleKeys(orderKey);
        } else if (typeof orderKey === "string") {
            if (orderKey === "" || Object.entries(orderKey).length === 0) {
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

    public validateApplyKey(applyArray: any[]) {
        if (!Array.isArray(applyArray)) {
            throw new InsightError();
        }
        let hasSeen: any[] = [];
        for (const value of Object.values(applyArray)) {
            for (const key of Object.keys(value)) {
                if (hasSeen.indexOf(key) !== -1 || key.toString().includes("_") || key.toString() === "") {
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

    public validateInputString(inpustring: any): void {
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

    public validateKeyColumnsWithTransformation(key: any) {
        if (key !== null || key !== undefined || typeof key !== "string") {
            let field = key.substring(key.indexOf("_") + 1);
            let mFields = ["avg", "pass", "fail", "audit", "year", "lat" , "lon", "seats"];
            let sFields = ["dept", "id", "instructor", "title", "uuid", "fullname", "shortname", "number", "name",
                "address", "type", "furniture", "href"];
            if ( !(mFields.indexOf(field) > -1) && !(sFields.indexOf(field) > -1 )) {
                throw new InsightError();
            }
        } else {
            throw new InsightError();
        }
    }

    private determineKind() {
        if (typeof this.query.getIdString() !== "undefined") {
            let kind;
            if (typeof this.kind === "undefined") {
                let fs = require("fs");
                let filetoRead = this.query.getIdString();
                let data = fs.readFileSync(`./data/${filetoRead}`);
                let content = JSON.parse(data);
                let formatter = new Formatter();
                this.kind = formatter.getKind(content);
            }
        }
    }

    public validateKey(key: any, type: string): boolean {
        if (key !== null || key !== undefined || typeof key !== "string") {
            let id = key.substring(0, key.indexOf("_"));
            if (key.indexOf("_") > -1) {
                this.query.setIdString(id);
                this.isIDinListofIDs(id);
            }
            this.determineKind();
            let kind = this.kind;
            let field = key.substring(key.indexOf("_") + 1);
            let mFields;
            let sFields;
            let mFieldsCourses = ["avg", "pass", "fail", "audit", "year"];
            let mFieldRooms = ["lat" , "lon", "seats"];
            let sFieldsCourses = ["dept", "id", "instructor", "title", "uuid"];
            let sFieldRooms = ["fullname", "shortname", "number", "name",
                "address", "type", "furniture", "href"];
            if (kind === "courses") {
                mFields = mFieldsCourses;
                sFields = sFieldsCourses;
            } else if (kind === "rooms") {
                mFields = mFieldRooms;
                sFields = sFieldRooms;
            }
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

    public isIDinListofIDs(id: any): void {
        let fs = require("fs");
        let currentDataFiles: string[] = fs.readdirSync("./data/");
        if (!(currentDataFiles.indexOf(id) > -1)) {
            throw new InsightError();
        }
    }

    public validateNumber(num: any): void {
        if (typeof num !== "number") {
            throw new InsightError();
        }
    }

}
