import {InsightError} from "./IInsightFacade";


export class Formatter {
    public getKind(data: any): any {
        let kind;
        if (Object.values(data.kind).length !== 0) {
            kind = data.kind;
            return kind;
        } else {
            throw new InsightError();
        }
    }

    public formatCourses(data: any): any[] {
        let allcourses: any[] = [];
        for (const val of Object.values(data.courses)) {
            let course = Object.values(val)[1];
            for (const section of Object.values(course)) {
                allcourses.push(section);
            }
        }
        return allcourses;
    }

    public formatRooms(data: any): any[] {
        let allRooms: any[] = [];
        for (const room of Object.values(data.rooms)) {
                allRooms.push(room);
            }
        return allRooms;
    }
}
