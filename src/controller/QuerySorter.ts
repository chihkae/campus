

export default class QuerySorter {
    public sort(result: any, keyToSort: any[]): any[] {
        let sortedResult = [];
        let stringFields = ["fullname", "shortname" , "number", "name", "address", "furniture", "type",
            "href", "instructor", "title", "dept" , "id" , "uuid" ];
        if (stringFields.indexOf(keyToSort[0]) !== -1) {
            sortedResult = result.sort(function (a: any, b: any) {
                if (a[keyToSort[0]].toString() > b[keyToSort[0]].toString()) {
                    return 1;
                } else if (a[keyToSort[0]].toString() < b[keyToSort[0]].toString()) {
                    return -1;
                } else {
                    return this.breakTies(a, b, keyToSort);
                }
            });
        } else {
            sortedResult = result.sort(function (a: any, b: any) {
                if(Number(a[keyToSort[0]]) - Number(b[keyToSort[0]])) {
                    return Number(a[keyToSort[0]]) - Number(b[keyToSort[0]]);
                } else {
                    return this.breakTies(a, b, keyToSort);;
                }
            });
        }
        return sortedResult;
    }

    public breakTies(a: any, b: any, keyToSort: any[]){
        keyToSort.shift();
        while (keyToSort.length !== 0) {
            if (a[keyToSort[0]].toString() > b[keyToSort[0]].toString()) {
                return 1;
            } else if (a[keyToSort[0]].toString() < b[keyToSort[0]].toString()) {
                return -1;
            } else {
                this.breakTies(a, b, keyToSort );
            }
        }
        return 0;
    }

    public sortDirection(result: any[], direction: any) {
        if (direction === "DOWN") {
            return result.reverse();
        } else if (direction === "UP") {
            return result;
        }
    }


}
