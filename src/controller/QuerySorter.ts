

export default class QuerySorter {
    public sort1(result: any, keyToSort: any[]): any[] {
        let sortedResult = [];
        let stringFields = ["fullname", "shortname" , "number", "name", "address", "furniture", "type",
            "href", "instructor", "title", "dept" , "id" , "uuid" ];
        if (keyToSort !== undefined) {
            if (stringFields.indexOf(keyToSort[0]) !== -1) {
                sortedResult = result.sort((a: any, b: any) => {
                    if (a[keyToSort[0]].toString() > b[keyToSort[0]].toString()) {
                        return 1;
                    } else if (a[keyToSort[0]].toString() < b[keyToSort[0]].toString()) {
                        return -1;
                    } else {
                        const copy = Object.assign([], keyToSort);
                        return this.breakTies(a, b, copy) ;
                    }
                });
            } else {
                 sortedResult = result.sort((a: any, b: any) => {
                    if (Number(a[keyToSort[0]]) - Number(b[keyToSort[0]]) > 0) {
                        return 1;
                    } else if (Number(a[keyToSort[0]]) - Number(b[keyToSort[0]]) < 0) {
                        return -1;
                    } else {
                        const copy = Object.assign([], keyToSort);
                        return this.breakTies(a, b, copy) ;
                    }
                });
            }
        } else {
            sortedResult = result;
        }
        return sortedResult;
    }

    private breakTies(a: any, b: any, copy: any[]): number {
        copy.shift();
        let stringFields = ["fullname", "shortname" , "number", "name", "address", "furniture", "type",
            "href", "instructor", "title", "dept" , "id" , "uuid" ];
        while (copy.length !== 0) {
            if (stringFields.indexOf(copy[0]) !== -1) {
                if (a[copy[0]].toString() > b[copy[0]].toString()) {
                    return 1;
                } else if (a[copy[0]].toString() < b[copy[0]].toString()) {
                    return -1;
                } else {
                    return this.breakTies(a, b, copy);
                }
            } else {
                if (Number(a[copy[0]]) - Number(b[copy[0]]) > 0) {
                    return 1;
                } else if (Number(a[copy[0]]) - Number(b[copy[0]]) < 0) {
                    return -1;
                } else {
                    return this.breakTies(a, b, copy);
                }
            }
        }
        return Number(0);
    }

    public sortDirection(result: any[], direction: any) {
        if (direction === "DOWN") {
            return result.reverse();
        } else if (direction === "UP") {
            return result;
        }
    }


}
