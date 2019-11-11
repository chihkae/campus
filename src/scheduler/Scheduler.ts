import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
export default class Scheduler implements IScheduler {
    private firstRoomLat: number = undefined;
    private firstRoomLon: number = undefined;
    private score: number = 0;
    private totalStudents: number = 0;
    private enrolled: number = 0;
    private D: number = 0;

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
        this.calculateTotalStudents(sectionSorted);
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
        roomsSorted = this.groupByBuilding(roomsSorted);

        let result = this.makeSchedule(sectionSorted, roomsSorted);
        return result;
    }

    private groupByBuilding(rooms: SchedRoom[]): SchedRoom[] {
        let result: SchedRoom[] = [];
        let i;
        let j;
        for (i = 0; i < rooms.length ; i++) {
            result.push(rooms[i]);
            for (j = i + 1; j < rooms.length ; j++) {
                if (rooms[i].rooms_lat === rooms[j].rooms_lat && rooms[i].rooms_lon === rooms[j].rooms_lon &&
                    rooms[i].rooms_number
                    !== rooms[j].rooms_number ) {
                    result.push(rooms[j]);
                    delete rooms[j];
                }
            }
        }
        return result;
    }

    private calculateTotalStudents(sections: SchedSection[]) {
        for (const section of sections) {
            this.totalStudents += section.courses_fail + section.courses_pass + section.courses_audit;
        }
    }

    private makeSchedule(sectionSorted: SchedSection[], roomsSorted: SchedRoom[]):
        Array<[SchedRoom, SchedSection, TimeSlot]> {
        let result: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
        let count = 0;
        let roomsAndTimeSlot = this.insertTimetoRooms(roomsSorted);
        for (const section of sectionSorted) {
            if (roomsAndTimeSlot.length === 0) {
                break;
            } else {
                count = 0;
                let toAdd: [SchedRoom, SchedSection, TimeSlot]  = [undefined, undefined, undefined];
                let roomsAndTimeToPick;
                for (const roomsandTime of roomsAndTimeSlot) {
                    if (roomsandTime[0].rooms_seats >= section.courses_audit + section.courses_pass +
                        section.courses_fail && !this.conflictInSectionTime(section, roomsandTime[1], result)) {
                        roomsAndTimeToPick = roomsandTime;
                        break;
                    } else {
                        count++;
                    }
                }
                if (roomsAndTimeToPick !== undefined && this.isNewBuilding(roomsAndTimeToPick[0])) {
                    let totalstudents = section.courses_audit + section.courses_pass + section.courses_fail;
                    if (this.isWorthit(roomsAndTimeToPick[0].rooms_lat,
                        roomsAndTimeToPick[0].rooms_lon, totalstudents)) {
                        this.setFirstRoom(roomsAndTimeToPick[0]);
                        roomsAndTimeSlot.splice(count, 1);
                        toAdd[0] = roomsAndTimeToPick[0];
                        toAdd[1] = section;
                        toAdd[2] = roomsAndTimeToPick[1];
                        result.push(toAdd);
                    }
                } else if (roomsAndTimeToPick !== undefined && !this.isNewBuilding(roomsAndTimeToPick[0])) {
                    roomsAndTimeSlot.splice(count, 1 );
                    toAdd[0] = roomsAndTimeToPick[0];
                    toAdd[1] = section;
                    toAdd[2] = roomsAndTimeToPick[1];
                    result.push(toAdd);
                }
            }
        }
        return result;
    }

    private setFirstRoom(room: SchedRoom) {
        if (this.firstRoomLon === undefined && this.firstRoomLat === undefined) {
            this.firstRoomLat = room.rooms_lat;
            this.firstRoomLon = room.rooms_lon;
        }
    }

    private conflictInSectionTime(section: SchedSection, time: TimeSlot,
                                  result: Array<[SchedRoom, SchedSection, TimeSlot]> ) {
        for (const scheduled of result) {
            if (scheduled[2] === time && scheduled[1].courses_id === section.courses_id &&
            scheduled[1].courses_title === section.courses_title) {
                return true;
            }
        }
        return false;
    }

    private isNewBuilding(roomB: SchedRoom): boolean {
        if (this.firstRoomLat === undefined && this.firstRoomLon === undefined) {
            return true;
        } else {
            if (roomB.rooms_lon !== this.firstRoomLon && roomB.rooms_lat !== roomB.rooms_lat) {
                return true;
            } else {
                return false;
            }
        }
    }

    private isWorthit(lat: number, lon: number, students: number): boolean {
        if (this.firstRoomLat === undefined && this.firstRoomLon === undefined) {
            let D = 0;
            let E = students / this.totalStudents;
            this.enrolled += students;
            this.score = D + (0.7 * E);
            return true;
        } else {
            let D = this.calcCrow(lat, lon);
            let E = ((this.enrolled + students) / this.totalStudents);
            if ((0.3 * (1 - D) + 0.7 * E) > this.score ) {
                if ( D > this.D ) {
                    this.D = D;
                }
                this.score = (1 - this.D) + 0.7 * E;
                this.enrolled += students;
                return  true;
            } else {
                return false;
            }
        }
    }

    private insertTimetoRooms(rooms: SchedRoom[]): Array<[SchedRoom, TimeSlot]> {
        let timeSlotsAvailable: TimeSlot[] = ["MWF 0800-0900" , "MWF 0900-1000", "MWF 1000-1100", "MWF 1100-1200",
            "MWF 1200-1300" , "MWF 1300-1400" , "MWF 1400-1500" , "MWF 1500-1600" , "MWF 1600-1700" , "TR  0800-0930",
            "TR  0930-1100" , "TR  1100-1230" , "TR  1230-1400" , "TR  1400-1530" , "TR  1530-1700"];
        let result: Array<[SchedRoom, TimeSlot]> = [];
        for (const room of rooms) {
            for (const time of timeSlotsAvailable) {
                let toAdd: [SchedRoom, TimeSlot] = [undefined, undefined];
                toAdd[0] = room;
                toAdd[1] = time;
                result.push(toAdd);
            }
        }
        return result;
    }

    private closestFit(students: number, rooms: SchedRoom[] ) {
        let min = students;
        let count = 0;
        for (const room of Object.values(rooms)) {
            if (room.rooms_seats < min && room.rooms_seats > students) {
                min = room.rooms_seats;
            } else {
                delete rooms[count];
            }
            count++;
        }
    }

    private calcCrow(lat2: number, lon2: number): number {
        let R = 6371; // km
        let dLat = this.toRad(lat2 - this.firstRoomLat);
        let dLon = this.toRad(lon2 - this.firstRoomLon);
        let lat1 = this.toRad(this.firstRoomLat);
        lat2 = this.toRad(lat2);

        let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        let d = R * c;
        return d;
    }

    // Converts numeric degrees to radians
    private toRad(value: number): number {
        return value * Math.PI / 180;
    }
}
