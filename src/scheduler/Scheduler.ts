import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
export default class Scheduler implements IScheduler {

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        let sectionSorted: SchedSection[] = sections.sort(function (a, b) {
            let numStudentsA = a.courses_audit + a.courses_pass + a.courses_fail;
            let numStudentsB = b.courses_audit + b.courses_pass + b.courses_fail;

            if (numStudentsA > numStudentsB) {
                return -1;
            } else if (numStudentsA < numStudentsB) {
                return 1;
            } else {
                return 0;
            }
        });
        let roomsSorted: SchedRoom[] = rooms.sort( function (a, b) {
            let numSeatsA = a.rooms_seats;
            let numSeatsB = b.rooms_seats;

            if (numSeatsA > numSeatsB) {
                return -1;
            } else if (numSeatsA < numSeatsB) {
                return 1;
            } else {
                return 0;
            }
        });
        let timeSlotsAvailable: TimeSlot[] = ["MWF 0800-0900" , "MWF 0900-1000", "MWF 1000-1100", "MWF 1100-1200",
            "MWF 1200-1300" , "MWF 1300-1400" , "MWF 1400-1500" , "MWF 1500-1600" , "MWF 1600-1700" , "TR  0800-0930",
            "TR  0930-1100" , "TR  1100-1230" , "TR  1230-1400" , "TR  1400-1530" , "TR  1530-1700"];
        let result = this.makeSchedule(sectionSorted, roomsSorted, timeSlotsAvailable);
        return result;
    }

    private makeSchedule(sectionSorted: SchedSection[], roomsSorted: SchedRoom[],
                         timeSlotsAvailable: TimeSlot[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        let result: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
        let coursesAddedSoFarAndTime: Array<[SchedSection, TimeSlot]> = [];
        let count = 0;
        for (const section of sectionSorted) {
            if (roomsSorted.length === 0) {
                break;
            } else if (roomsSorted[0].rooms_seats < (section.courses_fail + section.courses_pass +
                section.courses_audit)) {
                break;
            } else {
                if (count === 15) {
                    count = 0;
                }
                let toAdd: [SchedRoom, SchedSection, TimeSlot]  = [undefined, undefined, undefined];
                let coursesAndTime: [SchedSection, TimeSlot] = [undefined, undefined];
                toAdd[0] = roomsSorted[0];
                toAdd[1] = section;
                coursesAndTime[0] = section;
                let timeTopick  = timeSlotsAvailable[count];
                let next = 0;
                if (count === 14) {
                    next = 0;
                } else {
                    next = count++;
                }
                for (const courseAndTime of coursesAddedSoFarAndTime) {
                    if ((timeTopick === coursesAndTime[1]) &&
                        (section.courses_title === coursesAndTime[0].courses_title)) {
                        timeTopick = timeSlotsAvailable[next];
                    }
                }
                toAdd[2] = timeTopick;
                coursesAndTime[1] = timeTopick;
                coursesAddedSoFarAndTime.push(coursesAndTime);
                roomsSorted.shift();
                count++;
                result.push(toAdd);
            }
        }
        return result;
    }
        // TODO Implement this
}
