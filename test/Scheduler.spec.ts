import {expect} from "chai";
import * as fs from "fs-extra";
import Log from "../src/Util";
import TestUtil from "./TestUtil";
import Scheduler from "../src/scheduler/Scheduler";
import InsightFacade from "../src/controller/InsightFacade";
import Server from "../src/rest/Server";

describe("Facade D3", function () {

    let sections1 = [
        {
            courses_dept: "cpsc",
            courses_id: "340",
            courses_uuid: "1319",
            courses_pass: 101,
            courses_fail: 7,
            courses_audit: 2
        },
        {
            courses_dept: "cpsc",
            courses_id: "340",
            courses_uuid: "3397",
            courses_pass: 171,
            courses_fail: 3,
            courses_audit: 1
        },
        {
            courses_dept: "cpsc",
            courses_id: "344",
            courses_uuid: "62413",
            courses_pass: 93,
            courses_fail: 2,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "344",
            courses_uuid: "72385",
            courses_pass: 43,
            courses_fail: 1,
            courses_audit: 0
        }
    ];

    let sections2 = [
        {
            courses_dept: "cpsc",
            courses_id: "340",
            courses_uuid: "1319",
            courses_pass: 101,
            courses_fail: 7,
            courses_audit: 2
        },
        {
            courses_dept: "cpsc",
            courses_id: "340",
            courses_uuid: "1319",
            courses_pass: 500,
            courses_fail: 7,
            courses_audit: 2
        },
        {
            courses_dept: "cpsc",
            courses_id: "340",
            courses_uuid: "3397",
            courses_pass: 171,
            courses_fail: 3,
            courses_audit: 1
        },
        {
            courses_dept: "cpsc",
            courses_id: "344",
            courses_uuid: "62413",
            courses_pass: 93,
            courses_fail: 2,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "344",
            courses_uuid: "72385",
            courses_pass: 43,
            courses_fail: 1,
            courses_audit: 0
        }
    ];

    let rooms = [
        {
            rooms_shortname: "AERL",
            rooms_number: "120",
            rooms_seats: 144,
            rooms_lat: 49.26372,
            rooms_lon: -123.25099
        },
        {
            rooms_shortname: "ALRD",
            rooms_number: "105",
            rooms_seats: 94,
            rooms_lat: 49.2699,
            rooms_lon: -123.25318
        },
        {
            rooms_shortname: "ANGU",
            rooms_number: "098",
            rooms_seats: 260,
            rooms_lat: 49.26486,
            rooms_lon: -123.25364
        },
        {
            rooms_shortname: "BUCH",
            rooms_number: "A101",
            rooms_seats: 275,
            rooms_lat: 49.26826,
            rooms_lon: -123.25468
        }
    ];


    // Sample on how to format PUT requests
    it("Scheduler test", function () {
            let S = new Scheduler();
            let result = S.schedule(sections1, rooms);
            expect(result).to.have.length(4);
    });

    // Sample on how to format PUT requests
    it("Scheduler test", function () {
        let S = new Scheduler();
        let result = S.schedule(sections2, rooms);
        expect(result).to.have.length(4);
    });
});
