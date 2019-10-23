import Log from "../Util";
import {InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as JSZip from "jszip";
import {extractBuildingData, extractRoomData} from "./DomTraverser";

export default class Dataset implements InsightDataset {
    public id: string;
    public kind: InsightDatasetKind;
    public courses: Course[];
    public rooms: Room[];
    public numRows: number;
}

export class Course {
    public name: string;
    public sections: Section[];
}

export class Section {
    public dept: string;
    public id: string;
    public avg: number;
    public instructor: string;
    public title: string;
    public pass: number;
    public fail: number;
    public audit: number;
    public uuid: string;
    public year: number;
}

export class Building {
    public shortname: string;
    public address: string;
    public rooms: Room[];
}

export class Room {
    public fullname: string;
    public shortname: string;
    public number: string;
    public name: string;
    public address: string;
    public lat: number;
    public lon: number;
    public seats: number;
    public type: string;
    public furniture: string;
    public href: string;
}

export function addCoursesDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
    // initialize the dataset object that will eventually be saved to disk
    let datasetToAdd: Dataset = initializeDataset(id, kind);

    // initialize the array of promises for the Promise.all call
    let promises: Array<Promise<void>> = [];

    // get a Buffer of the file content to use with loadAsync()
    let buff = new Buffer(content, "base64");
    return JSZip.loadAsync(buff).then(function (zip: JSZip) {
        // for each file, retrieve its contents as a string
        promises = Object.keys(zip.files).map(function (filename) {
            if (filename !== "courses/") { // in order to avoid the root "courses" file
                return zip.files[filename].async("text")
                // use the string data to parse course information
                    .then(function (txt: string) {
                        // remove the "courses/" part of the file name
                        let courseName = filename.split("/").pop();
                        let course = parseCourse(txt, courseName);
                        if (course !== undefined) {
                            datasetToAdd.courses.push(course);
                        }
                    });
            }
        });
        // Once all the courses and sections are parsed, serialize and save them to disk
        return Promise.all(promises).then(() => {
            datasetToAdd.numRows = getNumberOfSections(datasetToAdd);
            if (datasetToAdd.numRows > 0) {
                return Promise.resolve(writeDatasetToDisk(datasetToAdd, id));
            } else {
                return Promise.reject(new InsightError("There were no courses, or there were no sections"));
            }
        });
    }).catch((err) => {
        return Promise.reject(new InsightError(err.toString()));
    });
}

export function addRoomsDataset(id: string, content: string, kind: InsightDatasetKind): any {
    // initialize the dataset object that will eventually be saved to disk
    let datasetToAdd: Dataset = initializeDataset(id, kind);
    const parse5 = require("parse5");
    let promises: Array<Promise<void>> = []; // initialize the array of promises for the Promise.all call
    let buildings: Building[] = [];
    let rooms: Room[] = [];
    let buff = new Buffer(content, "base64");
    return JSZip.loadAsync(buff).then(function (zip: JSZip) {
        promises = Object.keys(zip.files).map(function (filename) {
            return zip.files[filename].async("text")
                .then(function (txt: string) {
                    let document = parse5.parse(txt);
                    if (filename === "rooms/index.htm") {
                        let buildingData = extractBuildingData(document);
                        buildings = buildingData;
                    } else if (filename.substr(filename.lastIndexOf("/") + 1) !== "") {
                        let roomData = extractRoomData(document, filename);
                        if (roomData !== undefined) {
                            rooms.push(roomData);
                        }
                    }
                });
        });
        return Promise.all(promises).then(() => {
            let neededRooms: Room[] = [];
            // we only need room data from the buildings from index.htm
            rooms = [].concat.apply([], rooms); // flatten rooms array
            // add address info to each room
            rooms.forEach((room) => {
                buildings.forEach((building) => {
                    if (building.shortname === room.shortname) {
                        room.address = building.address;
                        // TODO: get building location
                        room.lat = 1;
                        room.lon = 2;
                        neededRooms.push(room);
                    }
                });
            });
            datasetToAdd.rooms = neededRooms;
            datasetToAdd.numRows = neededRooms.length;
            if (datasetToAdd.rooms.length > 0) {
                return Promise.resolve(writeDatasetToDisk(datasetToAdd, id));
            }
        });
    }).catch((err) => {
        return Promise.reject(new InsightError(err.toString()));
    });
}

// returns false if id is whitespace, includes an underscore, or is null
export function validateId(id: string): boolean {
    return !(id === null || id.trim() === "" || id.includes("_"));
}

export function getNumberOfSections(dataset: Dataset): number {
    if (dataset.courses.length === 0) {
        return 0;
    }
    let total: number = 0;
    dataset.courses.forEach(function (course) {
        total += course.sections.length;
    });
    return total;
}

// creates a Dataset object with the given object and kind, with an empty array of courses and numRows = 0
export function initializeDataset(id: string, kind: InsightDatasetKind): Dataset {
    let dataset: Dataset = new Dataset();
    dataset.id = id;
    dataset.kind = kind;
    dataset.numRows = 0;
    dataset.courses = [];
    dataset.rooms = [];
    return dataset;
}

// This function writes the given Dataset to the "data" directory, and returns a promise
// with all of the currently added dataset ids
export function writeDatasetToDisk(dataset: Dataset, id: string): string[] {
    let fs = require("fs");
    let myJSON: string = JSON.stringify(dataset);
    fs.writeFileSync(`./data/${id}`, myJSON);
    Log.info(`wrote ${id} to disk`);
    return getCurrentlyAddedDatasetIds();
}

// returns a string array of the currently added datasets
export function getCurrentlyAddedDatasetIds(): string[] {
    let fs = require("fs");
    let currentDataFiles: string[] = fs.readdirSync("./data");
    return currentDataFiles;
}

// takes in a JSON string representation of a course and returns a corresponding course object
export function parseCourse(text: string, fileName: string): Course {
    let courseAsJSON;
    // get course as a JSON object
    try {
        courseAsJSON = JSON.parse(text);
    } catch (e) {
        Log.error("the file was unable to be parsed into JSON");
        return undefined;
    }
    // get the results key (holds all the courses)
    let courses: [] = courseAsJSON["result"];
    if (courses === undefined || courses === null) {
        return undefined;
    }
    let sections: Section[] = [];
    // check if the course has any sections
    if (courses.length > 0) {
        // for each section in the course, extract the necessary data
        for (let section of courses) {
            if (!isEmpty(section)) {
                let s = extractSectionData(section);
                sections.push(s);
            }
        }
        // return a course with all of its sections
        let course: Course = new Course();
        course.name = fileName;
        course.sections = sections;
        return course;
    }
}

// returns true if the given object is empty
function isEmpty(obj: {}) {
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
}

// extracts necessary data from a JSON representation of a section, and returns
// a section with that information
function extractSectionData(section: any): Section {
    let sect = new Section();
    // extract the numbers from the file name (for the course id)
    sect.id = section.Course;
    sect.uuid = section.id.toString();
    sect.instructor = section.Professor;
    sect.title = section.Title;
    sect.pass = section.Pass;
    sect.fail = section.Fail;
    sect.audit = section.Audit;
    sect.avg = section.Avg;
    // if the Section property is "overall", set year to 1900
    if (section.Section === "overall") {
        sect.year = 1900;
    } else {
        sect.year = Number(section.Year);
    }
    sect.dept = section.Subject;
    return sect;
}
