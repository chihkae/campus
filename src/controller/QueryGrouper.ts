import Query from "./Query";
import {IQueryValidator} from "./InsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";

export default class QueryGrouper {


    public groupResult(groupKey: any[], result: string[]): any[] {
        for (let i = 0; i < groupKey.length ; i++) {
            if (typeof groupKey[i] !== "string") {
                throw new InsightError();
            }
        }
        let groups: any[] = [];

        if (groupKey.length === 0) {
            return result;
        } else {
            let count = 0;
            let groupMapper = new Map();
            result.forEach(function (section)
            {
                let group = section[groupKey[0]];
                if (groupMapper.get(group) === undefined) {
                    groupMapper.set(group, count);
                    count++;
                }
                let index = groupMapper.get(group);
                if (groups[index] === undefined) {
                    groups[index] = [];
                }
                groups[index].push(section);
            });
            groupKey.shift();
            return this.groupRecurse(groupKey, groups);
        }
    }

    private groupRecurse(groupKey: any[], groups: any[]): any[] {

        if (groupKey.length === 0) {
            return groups;
        } else {
            let result: any[] = [];
            let key = groupKey[0];
            let groupMapper = new Map();
            let count = 0;
            groups.forEach(function (group: any[]) {
                group.forEach(function (section: any) {

                    let group = section[key];
                    if (groupMapper.get(group) === undefined) {
                        groupMapper.set(group, count);
                        count++;
                    }
                    let index = groupMapper.get(group);
                    if (result[index] === undefined) {
                        result[index] = [];
                    }
                    result[index].push(section);
                });
            });
            groupKey.shift();
            return this.groupRecurse(groupKey, result);
        }
    }
       /* let groups : any[] = [];
        let prev: any = undefined;
        result.forEach(function(section)
        {
            groupKey.forEach(function(key)
            {
                if(prev === undefined){
                    prev = key;
                }
                let oldGroup = section[prev];
                let newGroup = section[key];

                if(groups[oldGroup] === undefined){
                    groups[oldGroup] = [];
                }
                if(groups[newGroup] === undefined){
                    groups[newGroup] === [];
                }

                groups[oldGroup].push(section);
                groups[newGroup].push(section);
                if(groups[oldGroup] === groups[newGroup]){
                    groups[newGroup].remove(section);
                }
            });
            prev = undefined;
        });
        return groups;*/
}
