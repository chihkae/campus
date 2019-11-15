import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import has = Reflect.has;
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
                if (rooms[i].rooms_lat === rooms[j].rooms_lat && rooms[i].rooms_lon === rooms[j].rooms_lon) {
                    result.push(rooms[j]);
                    rooms.splice(j, 1 );
                }
            }
        }
        return result;
    }

    private makeSchedule(sectionSorted: SchedSection[], roomsSorted: SchedRoom[]):
        Array<[SchedRoom, SchedSection, TimeSlot]> {
        let finalResult: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
        let roomsAndTimeSlot = this.insertTimetoRooms(roomsSorted);
        let roomsToPass2 = JSON.parse(JSON.stringify(roomsAndTimeSlot));
        finalResult = this.algo2(roomsToPass2, sectionSorted);
        return finalResult;
    }


    private algo2(roomsAndTimeSlot: any, sectionSorted: SchedSection[]):
        Array<[SchedRoom, SchedSection, TimeSlot]> {
        let finalResult: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
        let score1 = -1;
        let j;
        for (j = 0; j < sectionSorted.length; j++) {
            if (roomsAndTimeSlot.length !== 0) {
                let distanceArray: number[] = Array(roomsAndTimeSlot.length).fill(0);
                let k;
                let z;
                for (k = 0; k < roomsAndTimeSlot.length - 2; k++) {
                    for (z = k + 1; z <= roomsAndTimeSlot.length - 1; z++) {
                        let distance: any = this.getDistanceFromLatLonInKm(roomsAndTimeSlot[k][0].rooms_lat,
                            roomsAndTimeSlot[k][0].rooms_lon, roomsAndTimeSlot[z][0].rooms_lat,
                            roomsAndTimeSlot[z][0].rooms_lon);
                        distanceArray[k] += distance;
                        distanceArray[z] += distance;
                    }
                }
                while (distanceArray.length !== 0) {
                    let smallestIndex = this.findMinIndex(distanceArray);
                    let added = false;
                    if (smallestIndex !== undefined &&
                        roomsAndTimeSlot[smallestIndex][0].rooms_seats >= (sectionSorted[j].courses_audit +
                        sectionSorted[j].courses_pass + sectionSorted[j].courses_fail)) {
                        let toAdd: [SchedRoom, SchedSection, TimeSlot] = [undefined, undefined, undefined];
                        toAdd[0] = roomsAndTimeSlot[smallestIndex][0];
                        toAdd[1] = sectionSorted[j];
                        toAdd[2] = roomsAndTimeSlot[smallestIndex][1];
                        finalResult.push(toAdd);
                        added = true;
                    } else {
                        distanceArray.splice(smallestIndex, 1);
                    }
                    if (added === true && this.calculateScore(finalResult, sectionSorted) > score1) {
                        score1 = this.calculateScore(finalResult, sectionSorted);
                        roomsAndTimeSlot.splice(smallestIndex, 1);
                        distanceArray.splice(smallestIndex, 1);
                        break;
                    } else if (added === true) {
                        distanceArray.splice(smallestIndex, 1);
                        finalResult.pop();
                    }
                }
            }
        }
        return finalResult;
    }

    private findMinIndex(distanceArray: any[]): number {
        let index;
        let i;
        let shortest;
        for (i = 0; i < distanceArray.length ; i++) {
            if (shortest === undefined) {
                shortest = distanceArray[i];
                index = i.valueOf();
            } else if (distanceArray[i] < shortest) {
                shortest = distanceArray[i];
                index = i.valueOf();
            }
        }
        return index;
    }

    private algo1(roomsAndTimeSlot: Array<[SchedRoom, TimeSlot]>, sectionSorted: SchedSection[]):
        Array<[SchedRoom, SchedSection, TimeSlot]> {
        let finalResult: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
        let score1 = 0;
        let j;
        for (j = 0; j < sectionSorted.length; j += 2) {
            let count = 0;
            while (roomsAndTimeSlot.length !== 0 && count < roomsAndTimeSlot.length) {
                if (roomsAndTimeSlot[count][0].rooms_seats > (sectionSorted[j].courses_audit +
                    sectionSorted[j].courses_pass + sectionSorted[j].courses_fail)) {
                    let toAdd: [SchedRoom, SchedSection, TimeSlot] = [undefined, undefined, undefined];
                    toAdd[0] = roomsAndTimeSlot[count][0];
                    toAdd[1] = sectionSorted[j];
                    toAdd[2] = roomsAndTimeSlot[count][1];
                    const temp = Object.assign([], finalResult);
                    finalResult.push(toAdd);
                    let hasConflict = this.conflictInSectionTime(toAdd, temp);
                    if (hasConflict === false && this.calculateScore(finalResult, sectionSorted) > score1) {
                        score1 = this.calculateScore(finalResult, sectionSorted);
                        roomsAndTimeSlot.splice(count, 1);
                        break;
                    } else {
                        finalResult.pop();
                    }
                }
                count++;
            }
        }
        let second = this.algo1helper(roomsAndTimeSlot, sectionSorted);
        finalResult.concat(second);
        return finalResult;
    }

    private algo1helper(roomsAndTimeSlot: Array<[SchedRoom, TimeSlot]>, sectionSorted: SchedSection[]):
        Array<[SchedRoom, SchedSection, TimeSlot]> {
        let finalResult: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
        let score1 = 0;
        let j;
        for (j = 0; j < sectionSorted.length; j++) {
            let count = 0;
            while (roomsAndTimeSlot.length !== 0 && count < roomsAndTimeSlot.length) {
                if (roomsAndTimeSlot[count][0].rooms_seats > (sectionSorted[j].courses_audit +
                    sectionSorted[j].courses_pass + sectionSorted[j].courses_fail)) {
                    let toAdd: [SchedRoom, SchedSection, TimeSlot] = [undefined, undefined, undefined];
                    toAdd[0] = roomsAndTimeSlot[count][0];
                    toAdd[1] = sectionSorted[j];
                    toAdd[2] = roomsAndTimeSlot[count][1];
                    const temp = Object.assign([], finalResult);
                    finalResult.push(toAdd);
                    let hasConflict = this.conflictInSectionTime(toAdd, temp);
                    if (hasConflict === false && this.calculateScore(finalResult, sectionSorted) > score1) {
                        score1 = this.calculateScore(finalResult, sectionSorted);
                        roomsAndTimeSlot.splice(count, 1);
                        break;
                    } else {
                        finalResult.pop();
                    }
                }
                count++;
            }
        }
        return finalResult;
    }

    private conflictInSectionTime(section: [SchedRoom, SchedSection , TimeSlot],
                                  result: Array<[SchedRoom, SchedSection, TimeSlot]> ) {
        for (const scheduled of result) {
            if (section[1].courses_id === scheduled[1].courses_id &&
            section[1].courses_title === scheduled[1].courses_title
            && section[2] === scheduled[2]) {
                return true;
            }
        }
        return false;
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


    private getGreatestDistance(result: Array<[SchedRoom, SchedSection, TimeSlot]>): number {
        let greatestDistance = 0;
        let i = 0;
        let j;
        for ( i = 0; i < result.length ; i++) {
            for (j = i + 1 ; j < result.length ; j++) {
                if (this.getDistanceFromLatLonInKm(result[i][0].rooms_lat, result[i][0].rooms_lat,
                    result[j][0].rooms_lat , result[j][0].rooms_lon) > greatestDistance) {
                    greatestDistance = this.getDistanceFromLatLonInKm(result[i][0].rooms_lat, result[i][0].rooms_lon,
                        result[j][0].rooms_lat , result[j][0].rooms_lon);
                }
            }
        }
        return greatestDistance;
    }

    private calculateScore(results: Array<[SchedRoom, SchedSection, TimeSlot]>, sections: SchedSection[]):
        number {
        let D = this.getGreatestDistance(results) / 1372;
        let E = this.calculateEnrolled(results);
        let totalEnrolled = this.calculateTotalStudents(sections);
        E = E / totalEnrolled;
        let score = (0.7 * E) + (0.3 * ( 1 - D));
        return score;
    }

    private calculateEnrolled(results: Array<[SchedRoom, SchedSection, TimeSlot]>): number {
        let totalEnrolled = 0;
        for (const result of results) {
            totalEnrolled += (result[1].courses_fail + result[1].courses_pass + result[1].courses_audit);
        }
        return totalEnrolled;
    }

    private  calculateTotalStudents(sections: SchedSection[]) {
        let totalStudents = 0;
        for (const section of sections) {
            totalStudents += section.courses_fail + section.courses_pass + section.courses_audit;
        }
        return totalStudents;
    }

    private getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): any {
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
