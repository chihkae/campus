import {Decimal} from "decimal.js";
import deleteProperty = Reflect.deleteProperty;
import {QueryKeyValidator} from "./QueryKeyValidator";

export default class QueryApplier {
    private queryKeyValidator = new QueryKeyValidator();

    public applytoGroup(groups: any[], keysVals: any[]): any[] {
        keysVals.forEach( (keyVal) => {
            let toName = keyVal["applyKey"];
            let applyToken = keyVal["applyToken"];
            let key = keyVal["key"];
            if (key.toString().includes("_")) {
                key = key.split("_")[1];
            }
            groups.map( (group) => {
                switch (applyToken) {
                    case "MAX":
                        let max = this.groupMax(group, key);
                        this.addApplyKey(group, toName, max);
                        break;
                    case "MIN":
                        let min = this.groupMin(group, key);
                        this.addApplyKey(group, toName, min);
                        break;
                    case "COUNT":
                        let count = this.groupCount(group, key);
                        group = this.addApplyKey(group, toName, count);
                        break;
                    case "SUM":
                        let sum = this.groupSum(group, key);
                        this.addApplyKey(group, toName, sum);
                        break;
                    case "AVG":
                        let avg = this.groupAvg(group, key);
                        this.addApplyKey(group, toName, avg);
                }
            });

        });

        return groups;
    }

    private addApplyKey(group: any, applyKey: any, value: any): any {
       group.forEach( function (sec: any) {
           sec[applyKey] = value;
       });
            /*if (applyKey !== origKey) {
                Object.defineProperty(group[0], applyKey,
                    Object.getOwnPropertyDescriptor(group[0], origKey));
            }*/
       return group;
    }

    private groupAvg(group: any[], key: any): number {
        this.queryKeyValidator.validateKey(key, "mKey");
        let sum = new Decimal(0);
        let rows = Number(0);
        group.forEach( (section) => {
            let x = new Decimal(section[key])
            sum = sum.add(x);
            rows++;
        });
        let avg = sum.toNumber() / rows;
        let final = Number(avg.toFixed(2));
        return final;
    }

    private groupCount(group: any[], key: any): number {
        let count = 0;
        let hasSeen: any[] = [];
        group.forEach(function (section) {
            if (hasSeen.indexOf(section[key]) === -1) {
               count++;
               hasSeen.push(section[key]);
            }
        });
        return count;
    }

    private groupSum(group: any[], key: any): number {
        this.queryKeyValidator.validateKey(key, "mKey");
        let sum = 0;
        group.forEach(function (section) {
            sum += Number(section[key]);
        });
        sum = Number(sum.toFixed(2));
        return sum;
    }

    private groupMin(group: any[], key: any): number {
        this.queryKeyValidator.validateKey(key, "mKey");
        let min: number;
     /*   let length = group.length;*/
       /* let acc = 1;
        let final: any[] = [];*/
        group.forEach( (section) => {
            if (min === undefined) {
                min = section[key];
            }
            if (section[key] < min) {
                min = section[key];
            }
            // if (acc === length) {
            //     final.push(section);
            // }
            // acc++;
        });

        /*for (const val of Object.values(final)) {
            val[key] = min;
        }*/
        return min;
    }

    private groupMax(group: any[], key: any): number {
        this.queryKeyValidator.validateKey(key, "mKey");
        let max: number;
        group.forEach(function (section) {
            if (max === undefined) {
                max = section[key];
            }
            if (section[key] > max) {
                max = section[key];
            }
        });
        return max;
    }
}
