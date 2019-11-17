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
            courses_id: "388",
            courses_uuid: "1319",
            courses_pass: 103,
            courses_fail: 7,
            courses_audit: 2
        },
        {
            courses_dept: "cpsc",
            courses_id: "375",
            courses_uuid: "1319",
            courses_pass: 1,
            courses_fail: 7,
            courses_audit: 2
        }
    ];


    let rooms = [
        {
            rooms_shortname: "CPSC",
            rooms_number: "A102",
            rooms_seats: 500,
            rooms_lat: 90.234,
            rooms_lon: -123.253
        },
        {
            rooms_shortname: "CPSC",
            rooms_number: "A102",
            rooms_seats: 1,
            rooms_lat: 90.234,
            rooms_lon: -123.253
        },
        {
            rooms_shortname: "12",
            rooms_number: "A1343",
            rooms_seats: 150,
            rooms_lat: 812.26825,
            rooms_lon: -1242.25467
        },
        {
            rooms_shortname: "12",
            rooms_number: "A1343",
            rooms_seats: 30,
            rooms_lat: 812.26825,
            rooms_lon: -1242.25467
        }
    ];


    // Sample on how to format PUT requests
    it("Scheduler test", function () {
            let S = new Scheduler();
            let result = S.schedule(sections1, rooms);
    });


});
