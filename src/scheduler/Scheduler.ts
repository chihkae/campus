import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
export default class Scheduler implements IScheduler {

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        let sectionSorted: SchedSection[] = sections.sort(function (a, b) {
            let numStudentsA = a.courses_audit + a.courses_pass + a.courses_fail;
            let numStudentsB = b.courses_audit + b.courses_pass + b.courses_fail;

            if (numStudentsA > numStudentsB) {
                return 1;
            } else if (numStudentsB < numStudentsB) {
                return -1;
            } else {
                return 0;
            }
        });

        let roomsSorted: SchedRoom[] = rooms.sort( function (a, b) {
            let numSeatsA = a.rooms_seats;
            let numSeatsB = b.rooms_seats;

            if (numSeatsA > numSeatsB) {
                return 1;
            } else if (numSeatsA < numSeatsB) {
                return -1;
            } else {
                return 0;
            }

        });
        let timeSlotsAvailable: TimeSlot[] = ["MWF 0800-0900" , "MWF 0900-1000", "MWF 1000-1100", "MWF 1100-1200",
            "MWF 1200-1300" , "MWF 1300-1400" , "MWF 1400-1500" , "MWF 1500-1600" , "MWF 1600-1700" , "TR  0800-0930",
            "TR  0930-1100" , "TR  1100-1230" , "TR  1230-1400" , "TR  1400-1530" , "TR  1530-1700"];

        let result: Array<[SchedRoom, SchedSection, TimeSlot]> = [];

        sectionSorted.forEach( function (section: SchedSection) {
            let toAdd: [SchedRoom, SchedSection, TimeSlot]  = [undefined, undefined, undefined];
            toAdd.push(roomsSorted[0]);
            toAdd.push(section);
            toAdd.push(timeSlotsAvailable[0]);
            timeSlotsAvailable.pop();
            roomsSorted.pop();
            result.push(toAdd);
        });
        return result;
    }
        // TODO Implement this
}
