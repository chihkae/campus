import {Decimal} from 'decimal.js';



export default class QueryApplier{

    public applytoGroup(groups: any[], keysVals: any[]){
        keysVals.forEach(function(keyVal){
            let key = Object(keyVal).key;
            let val = Object(keyVal).value;
            groups.forEach(function(group){
                switch(key){
                    case "MAX":
                        group = this.groupMax(group, val);
                        break;
                    case "MIN":
                        group = this.groupMin(group, val);
                        break;
                    case "COUNT":
                        group = this.groupCount(group, val);
                        break;
                    case "SUM":
                        group = this.groupSum(group, val);
                        break;
                    case "AVG":
                        group = this.groupAvg(group, val);
                }
            });
        });

        return groups;
    }
    private groupAvg (group: any[], key: any): any[]{
        let sum = new Decimal(0);
        let rows = 0;
        let length = group.length;
        let acc = 1;
        group.forEach(function(section) {
            sum.add(new Decimal(Number(section[key])));
            rows ++;
            if(length !== acc) {
                section.delete();
            }
            acc++;
        });
        let avg = sum.toNumber() / rows;
        avg = Number(avg.toFixed(2));
        group[key] = avg;
        return group;
    }

    private groupCount (group: any[], key: any): any[]{
        let count = 0;
        let length = group.length;
        let acc = 1;
        group.forEach(function(section) {
            count++;
            if(acc !== length) {
                section.delete();
            }
            acc++;
        });
        group[key] = count;
        return group;
    }

    private groupSum (group: any[], key: any): any[]{
        let sum = 0;
        let length = group.length;
        let acc = 1;
        group.forEach(function(section) {
            sum += Number(section[key]);
            if(acc !== length) {
                section.delete();
            }
            acc++
        });
        sum = Number(sum.toFixed(2));
        group[key] = sum;
        return group;
    }

    private groupMin (group: any[], key: any): any[]{
        let min: any = undefined;
        let length = group.length;
        let acc = 1;
        group.forEach(function(section) {
            if(section[key] < min){
                min = section[key];
            }
            if(acc !== length) {
                section.delete();
            }
            acc++;
        });
        group[key] = min;
        return group;
    }

    private groupMax (group: any[], key: any): any[]{
        let max: any = undefined;
        let length = group.length;
        let acc = 1;
        group.forEach(function(section) {
            if(section[key] > max){
                max = section[key];
            }
            if(acc !== length) {
                section.delete();
            }
            acc++;
        });
        group[key] = max;
        return group;
    }




}
