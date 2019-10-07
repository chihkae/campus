import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";
import * as JSZip from "jszip";
import {JSZipObject} from "jszip";
import {type} from "os";
import {Dataset, Course, Section} from "./Dataset";

// returns false if id is whitespace, includes an underscore, or is null
function validateId(id: string): boolean {
    return !(id === null || id.trim() === "" || id.includes("_"));
}

function getNumberOfSections(dataset: Dataset): number {
    if (dataset.courses.length === 0) { return 0; }
    let total: number = 0;
    dataset.courses.forEach(function (course) {
        total += course.sections.length;
    });
    return total;
}

// creates a Dataset object with the given object and kind, with an empty array of courses and numRows = 0
function initializeDataset(id: string, kind: InsightDatasetKind): Dataset {
    let dataset: Dataset = new Dataset();
    dataset.id = id;
    dataset.kind = kind;
    dataset.numRows = 0;
    dataset.courses = [];
    return dataset;
}

// This function writes the given Dataset to the "data" directory, and returns a promise
// with all of the currently added dataset ids
function writeDatasetToDisk(dataset: Dataset, id: string): string[] {
    let fs = require("fs");
    let myJSON: string = JSON.stringify(dataset);
    fs.writeFileSync(`./data/${id}`, myJSON);
    Log.info(`wrote ${id} to disk`);
    return getCurrentlyAddedDatasetIds();
}

// returns a string array of the currently added datasets
function getCurrentlyAddedDatasetIds(): string[] {
    let fs = require("fs");
    let currentDataFiles: string[] = fs.readdirSync("./data");
    return currentDataFiles;
}

// takes in a JSON string representation of a course and returns a corresponding course object
function parseCourse(text: string, fileName: string): Course {
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
    if (courses === undefined || courses === null) { return undefined; }
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
        if (obj.hasOwnProperty(key)) { return false; }
    }
    return true;
}

// extracts necessary data from a JSON representation of a section, and returns
// a section with that information
function extractSectionData(section: any): Section {
    let sect = new Section();
    // extract the numbers from the file name (for the course id)
    sect.id = section.Course;
    sect.uuid = section.id;
    sect.instructor = section.Professor;
    sect.title = section.Title;
    sect.pass = section.Pass;
    sect.fail = section.Fail;
    sect.audit = section.Audit;
    sect.avg = section.Avg;
    sect.year = section.Year;
    sect.dept = section.Subject;
    return sect;
}

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        // Validate id (must not contain underscore, be only whitespace, be null)
        // If invalid, reject with InsightError
        if (!validateId(id)) {
            return Promise.reject(new InsightError("id is invalid"));
        }
        // If is has already been added, reject
        if (getCurrentlyAddedDatasetIds().includes(id)) {
            return Promise.reject((new InsightError("A dataset with a corresponding Id has already been added")));
        }

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
                            if (course !== undefined) { datasetToAdd.courses.push(course); }
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

    public removeDataset(id: string): Promise<string> {
        // Validate id (must not contain underscore, be only whitespace, be null)
        // If invalid, reject with InsightError
        if (!validateId(id)) {
            return Promise.reject(new InsightError("id is invalid"));
        }
        // If is has not already  been added, reject
        if (!getCurrentlyAddedDatasetIds().includes(id)) {
            return Promise.reject((new NotFoundError("A dataset with a corresponding Id has already been added")));
        }

        const fs = require("fs");
        const path = `./data/${id}`;
        fs.unlinkSync(path);
        Log.info(`removed ${id} from disk`);
        return Promise.resolve(id);
    }

    public performQuery(query: any): Promise <any[]> {
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        const fs = require("fs");
        let currentlyAddedDatasets: string[] = fs.readdirSync("data");
        let toReturn: InsightDataset[] = [];
        currentlyAddedDatasets.forEach(function (dataset) {
            let datasetAsString: string = fs.readFileSync(`./data/${dataset}`).toString();
            // theoretically this JSON.parse() call should always work,
            // since we have validation when we add the dataset, they should all be properly formatted
            let datasetJson = JSON.parse(datasetAsString);
            const datasetToAdd: InsightDataset = {} as InsightDataset;
            datasetToAdd.id = datasetJson.id;
            datasetToAdd.kind = datasetJson.kind;
            datasetToAdd.numRows = datasetJson.numRows;
            toReturn.push(datasetToAdd);
        });
        toReturn.forEach(function (d) {
            Log.info(`Found dataset id "${d.id}" with kind: "${d.kind}" and numRows: ${d.numRows}`);
        });
        return Promise.resolve(toReturn);
    }
}
