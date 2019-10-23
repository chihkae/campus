import {Decimal} from "decimal.js";
import deleteProperty = Reflect.deleteProperty;

export default class QueryApplier {

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
                        group = this.groupMax(group, key);
                        group = this.renameKeyToApplyKey(group, toName, key);
                        break;
                    case "MIN":
                        let temp = this.groupMin(group, key);
                        temp = this.renameKeyToApplyKey(group, toName, key);
                        return Object.assign(temp, group);
                        break;
                    case "COUNT":
                        group = this.groupCount(group, key);
                        group = this.renameKeyToApplyKey(group, toName, key);
                        break;
                    case "SUM":
                        group = this.groupSum(group, key);
                        group = this.renameKeyToApplyKey(group, toName, key);
                        break;
                    case "AVG":
                        group = this.groupAvg(group, key);
                        group = this.renameKeyToApplyKey(group, toName, key);
                }
            });

        });

        return groups;
    }

    private renameKeyToApplyKey(group: any, applyKey: any, origKey: any): any {
       group.forEach( function (sec: any) {
           sec[applyKey] = sec[origKey];
           delete sec[origKey];
       });
            /*if (applyKey !== origKey) {
                Object.defineProperty(group[0], applyKey,
                    Object.getOwnPropertyDescriptor(group[0], origKey));
            }*/
       return group;
    }

    private groupAvg(group: any[], key: any): any[] {
        let sum = new Decimal(0);
        let rows = 0;
        let length = group.length;
        let acc = 1;
        group.forEach(function (section) {
            sum.add(new Decimal(Number(section[key])));
            rows++;
            if (length !== acc) {
                section.delete();
            }
            acc++;
        });
        let avg = sum.toNumber() / rows;
        avg = Number(avg.toFixed(2));
        group[key] = avg;
        return group;
    }

    private groupCount(group: any[], key: any): any[] {
        let count = 0;
        let length = group.length;
        let acc = 1;
        group.forEach(function (section) {
            count++;
            if (acc !== length) {
                section.delete();
            }
            acc++;
        });
        group[key] = count;
        return group;
    }

    private groupSum(group: any[], key: any): any[] {
        let sum = 0;
        let length = group.length;
        let acc = 1;
        group.forEach(function (section) {
            sum += Number(section[key]);
            if (acc !== length) {
                section.delete();
            }
            acc++;
        });
        sum = Number(sum.toFixed(2));
        group[key] = sum;
        return group;
    }

    private groupMin(group: any[], key: any): any[] {
        let min: number;
        let length = group.length;
        let acc = 1;
        let final: any[] = [];
        group.forEach( (section) => {
            if (min === undefined) {
                min = section[key];
            }
            if (section[key] < min) {
                min = section[key];
            }
            if (acc === length) {
                final.push(section);
            }
            acc++;
        });

        for (const val of Object.values(final)) {
            val[key] = min;
        }
        return final;
    }

    private groupMax(group: any[], key: any): any[] {
        let max: number;
        let length = group.length;
        let acc = 1;
        group.forEach(function (section) {
            if (max === undefined) {
                max = section[key];
            }
            if (section[key] > max) {
                max = section[key];
            }
            if (acc !== length) {
                section.delete();
            }
            acc++;
        });
        group[key] = max;
        return group;
    }
}
