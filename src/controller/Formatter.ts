

export class Formatter {

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
