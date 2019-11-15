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
            courses_uuid: "1319",
            courses_pass: 101,
            courses_fail: 7,
            courses_audit: 2
        },
        {
            courses_dept: "cpsc",
            courses_id: "332",
            courses_uuid: "1319",
            courses_pass: 101,
            courses_fail: 7,
            courses_audit: 2
        },
        {
            courses_dept: "cpsc",
            courses_id: "333",
            courses_uuid: "1319",
            courses_pass: 101,
            courses_fail: 7,
            courses_audit: 2
        },
        {
            courses_dept: "cpsc",
            courses_id: "392",
            courses_uuid: "1319",
            courses_pass: 101,
            courses_fail: 7,
            courses_audit: 2
        },
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
            courses_pass: 101,
            courses_fail: 7,
            courses_audit: 2
        },
        {
            courses_dept: "cpsc",
            courses_id: "323",
            courses_uuid: "1319",
            courses_pass: 101,
            courses_fail: 7,
            courses_audit: 2
        },
        {
            courses_dept: "cpsc",
            courses_id: "375",
            courses_uuid: "1319",
            courses_pass: 101,
            courses_fail: 7,
            courses_audit: 2
        },
        {
            courses_dept: "cpsc",
            courses_id: "357",
            courses_uuid: "1319",
            courses_pass: 101,
            courses_fail: 7,
            courses_audit: 2
        },
        {
            courses_dept: "cpsc",
            courses_id: "364",
            courses_uuid: "1319",
            courses_pass: 101,
            courses_fail: 7,
            courses_audit: 2
        },
        {
            courses_dept: "cpsc",
            courses_id: "355",
            courses_uuid: "1319",
            courses_pass: 101,
            courses_fail: 7,
            courses_audit: 2
        },
        {
            courses_dept: "cpsc",
            courses_id: "323",
            courses_uuid: "1319",
            courses_pass: 101,
            courses_fail: 7,
            courses_audit: 2
        },
        {
            courses_dept: "cpsc",
            courses_id: "344",
            courses_uuid: "3397",
            courses_pass: 0,
            courses_fail: 0,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "342",
            courses_uuid: "62413",
            courses_pass: 0,
            courses_fail: 0,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "345",
            courses_uuid: "72385",
            courses_pass: 0,
            courses_fail: 0,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "345",
            courses_uuid: "72385",
            courses_pass: 0,
            courses_fail: 0,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "345",
            courses_uuid: "72385",
            courses_pass: 0,
            courses_fail: 0,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "345",
            courses_uuid: "72385",
            courses_pass: 0,
            courses_fail: 0,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "345",
            courses_uuid: "72385",
            courses_pass: 0,
            courses_fail: 0,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "345",
            courses_uuid: "72385",
            courses_pass: 0,
            courses_fail: 0,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "345",
            courses_uuid: "72385",
            courses_pass: 1,
            courses_fail: 0,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "345",
            courses_uuid: "72385",
            courses_pass: 1,
            courses_fail: 0,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "345",
            courses_uuid: "72385",
            courses_pass: 1,
            courses_fail: 0,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "345",
            courses_uuid: "72385",
            courses_pass: 0,
            courses_fail: 0,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "345",
            courses_uuid: "72385",
            courses_pass: 0,
            courses_fail: 0,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "345",
            courses_uuid: "72385",
            courses_pass: 133,
            courses_fail: 0,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "345",
            courses_uuid: "72385",
            courses_pass: 1,
            courses_fail: 0,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "345",
            courses_uuid: "72385",
            courses_pass: 1,
            courses_fail: 0,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "345",
            courses_uuid: "72385",
            courses_pass: 100,
            courses_fail: 0,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "345",
            courses_uuid: "72385",
            courses_pass: 100,
            courses_fail: 0,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "345",
            courses_uuid: "72385",
            courses_pass: 100,
            courses_fail: 0,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "345",
            courses_uuid: "72385",
            courses_pass: 100,
            courses_fail: 0,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "345",
            courses_uuid: "72385",
            courses_pass: 100,
            courses_fail: 0,
            courses_audit: 0
        }
    ];


    let rooms = [
        {
            rooms_shortname: "AERL",
            rooms_number: "120",
            rooms_seats: 240,
            rooms_lat: 2.26372,
            rooms_lon: -50.25099
        },
        {
            rooms_shortname: "BUCH",
            rooms_number: "A101",
            rooms_seats: 300,
            rooms_lat: 90.26826,
            rooms_lon: -123.25468
        },
        {
            rooms_shortname: "BUCH",
            rooms_number: "A102",
            rooms_seats: 1,
            rooms_lat: 90.26826,
            rooms_lon: -123.25489
        },
        {
            rooms_shortname: "BUCH",
            rooms_number: "A103",
            rooms_seats: 102,
            rooms_lat: 88.26825,
            rooms_lon: -123.25467
        }
    ];


    // Sample on how to format PUT requests
    it("Scheduler test", function () {
            let S = new Scheduler();
            let result = S.schedule(sections1, rooms);
    });


});
