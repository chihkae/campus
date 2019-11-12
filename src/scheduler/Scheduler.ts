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

    private makeSchedule(sectionSorted: SchedSection[], roomsSorted: SchedRoom[]):
        Array<[SchedRoom, SchedSection, TimeSlot]> {
        let finalResult: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
        let roomsAndTimeSlot = this.insertTimetoRooms(roomsSorted);
        let i = 0;
        let j = 0;
        let score = -1;
        for (i = 0; i < roomsAndTimeSlot.length; i++) {
            let result: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
            for (j = 0; j < sectionSorted.length; j++) {
                if ((j < roomsAndTimeSlot.length) &&
                    roomsAndTimeSlot[j][0].rooms_seats > (sectionSorted[j].courses_audit +
                        sectionSorted[j].courses_pass + sectionSorted[j].courses_fail)) {
                    let toAdd: [SchedRoom, SchedSection, TimeSlot] = [undefined, undefined, undefined];
                    toAdd[0] = roomsAndTimeSlot[j][0];
                    toAdd[1] = sectionSorted[j];
                    toAdd[2] = roomsAndTimeSlot[j][1];
                    result.push(toAdd);
                }
                if (result.length > 0 && (this.calculateScore(result, sectionSorted) > score)) {
                    score = this.calculateScore(result, sectionSorted);
                    finalResult = result;
                } else if (result.length > 0) {
                    result.splice(-1, 1 );
                }
            }
        }
        return finalResult;
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

    // private isWorthit(lat: number, lon: number, students: number): boolean {
    //     if (this.firstRoomLat === undefined && this.firstRoomLon === undefined) {
    //         let D = 0;
    //         let E = students / this.totalStudents;
    //         this.enrolled += students;
    //         this.score = D + (0.7 * E);
    //         return true;
    //     } else {
    //         let D = this.calcCrow(lat, lon);
    //         let E = ((this.enrolled + students) / this.totalStudents);
    //         if ((0.3 * (1 - D) + 0.7 * E) > this.score ) {
    //             if ( D > this.D ) {
    //                 this.D = D;
    //             }
    //             this.score = (1 - this.D) + 0.7 * E;
    //             this.enrolled += students;
    //             return  true;
    //         } else {
    //             return false;
    //         }
    //     }
    // }

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

    // private closestFit(students: number, rooms: SchedRoom[] ) {
    //     let min = students;
    //     let count = 0;
    //     for (const room of Object.values(rooms)) {
    //         if (room.rooms_seats < min && room.rooms_seats > students) {
    //             min = room.rooms_seats;
    //         } else {
    //             delete rooms[count];
    //         }
    //         count++;
    //     }
    // }

    private getGreatestDistance(result: Array<[SchedRoom, SchedSection, TimeSlot]>): number {
        let greatestDistance = 0;
        let i = 0;
        let j;
        for ( i = 0; i < result.length ; i++) {
            for (j = i + 1 ; j < result.length ; j++) {
                if (this.getDistanceFromLatLonInKm(result[i][0].rooms_lat, result[i][0].rooms_lat,
                    result[j][0].rooms_lat , result[j][0].rooms_lon) > greatestDistance) {
                    greatestDistance = this.getDistanceFromLatLonInKm(result[i][0].rooms_lat, result[i][0].rooms_lat,
                        result[j][0].rooms_lat , result[j][0].rooms_lon);
                }
            }
        }
        return greatestDistance;
    }

    private calculateScore(results: Array<[SchedRoom, SchedSection, TimeSlot]>, sections: SchedSection[]): number {
        let D = this.getGreatestDistance(results) / 1372;
        let E = this.calculateEnrolled(results);
        let totalEnrolled = this.calculateTotalStudents(sections);
        E = E / totalEnrolled;
        let score = (0.7 * E) + (0.3 * ( D - 1));
        return score;
    }

    private calculateEnrolled(results: Array<[SchedRoom, SchedSection, TimeSlot]>): number {
        let totalEnrolled = 0;
        for (const result of results) {
            totalEnrolled += (result[1].courses_fail + result[1].courses_pass + result[1].courses_audit);
        }
        return totalEnrolled;
    }

    private calculateTotalStudents(sections: SchedSection[]) {
        let totalStudents = 0;
        for (const section of sections) {
            totalStudents += section.courses_fail + section.courses_pass + section.courses_audit;
        }
        return totalStudents;
    }

    private getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
        let R = 6371; // Radius of the earth in km
        let dLat = this.deg2rad(lat2 - lat1);  // deg2rad below
        let dLon = this.deg2rad(lon2 - lon1);
        let a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2 ) +
            Math.cos( this.deg2rad(lat1)) * Math.cos( this.deg2rad(lat2)) *
            Math.sin(dLon / 2 ) * Math.sin(dLon / 2 )
        ;
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a ));
        let d = R * c; // Distance in km
        return d;
    }

    private deg2rad(deg: number) {
        return deg * (Math.PI / 180);
    }
}
