import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";
import * as JSZip from "jszip";
import {JSZipObject} from "jszip";
import {type} from "os";
import {Dataset, Course, Section} from "./Dataset";

function validateId(id: string): boolean {
    // return false if id is whitespace, includes an underscore, is null, or has already been added
    return !(id.trim() === "" || id.includes("_") || id == null);
}

function initializeDataset(id: string, kind: InsightDatasetKind): Dataset {
    let dataset: Dataset = new Dataset();
    dataset.id = id;
    dataset.kind = kind;
    dataset.courses = [];
    return dataset;
}

function writeDatasetToDisk(dataset: Dataset, id: string): Promise<string[]> {
    let fs = require("fs");
    let myJSON: string = JSON.stringify(dataset);
    return fs.writeFile(`./test/data/${id}`, myJSON, function (err: any) {
        if (err) { return Promise.reject(err.toString()); }
        // return list of ids of currently added datasets
        return Promise.resolve(getCurrentlyAddedDatasetIds());
    });
}

function getCurrentlyAddedDatasetIds(): string[] {
    let fs = require("fs");
    let currentDataFiles: string[] = fs.readdirSync("data");
    return currentDataFiles;
}

function parseCourse(text: string, fileName: string): Course {
    // get course as a JSON object
    let courseAsJSON = JSON.parse(text);
    // get the results key (holds all the courses)
    let courses: [] = courseAsJSON["result"];
    let sections: Section[] = [];
    // check if the course has any sections
    if (courses.length > 0) {
        // for each section in the course, extract the necessary data
        for (let section of courses) {
            let s = extractSectionData(section, fileName);
            sections.push(s);
        }
        // return a course with all of its sections
        let course: Course = new Course();
        course.name = fileName;
        course.sections = sections;
        return course;
    }
}

function getCourseId(courseName: string): string {
    return courseName.match(/\d+/g).pop();
}

function extractSectionData(section: any, fileName: string): Section {
    let sect = new Section();
    // extract the numbers from the file name (for the course id)
    sect.id = getCourseId(fileName);
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
import QueryValidator from "./QueryValidator";
import QueryEvaluator from "./QueryEvaluator";

export interface IQueryValidator {
    validateQuery(query: any): boolean;
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
        JSZip.loadAsync(buff).then(function (zip: JSZip) {
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
                        })
                        .catch((err) => {
                            Log.error(filename);
                            Log.error(err);
                        });
                }
            });
            // Once all the courses and sections are parsed, serialize and save them to disk
            return Promise.all(promises).then(() => {
                return Promise.resolve(writeDatasetToDisk(datasetToAdd, id));
            }).catch((err) => {
                Log.error(err);
            });
        }).catch((err) => {
            Log.error(err);
        });

        // return Promise.reject("Not implemented.");
    }

    public removeDataset(id: string): Promise<string> {
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise <any[]> {
            return new Promise(function (resolve, reject) {
                let queryValidator = new QueryValidator();
                try {
                    if (queryValidator.validateQuery(query)) {
                        let fs = require("fs");
                        fs.readFile("./test/data/courses", (err: any, data: any) => {
                            if (err) {
                                reject("err");
                            } else {
                                try {
                                    let content = JSON.parse(data);
                                    let queryEvaluator = new QueryEvaluator(query, content);
                                    let unsortedResult = queryEvaluator.evaluateResult(query);
                                    let keys = queryValidator.getColumnsKeyWithoutUnderscore();
                                    let selectedColumnsResult = queryEvaluator.selectColumns(unsortedResult, keys);
                                    let orderkeys = queryValidator.getOrderKeyWithoutUnderscore();
                                    let sorted = queryEvaluator.sort(selectedColumnsResult, orderkeys);
                                    let id = queryValidator.getIdString();
                                    let sortedWithKeys = queryEvaluator.addID(sorted, id, keys );
                                    resolve(sortedWithKeys);
                                } catch (err) {
                                    Log.info(err);
                                }
                            }
                        });
                    }
                } catch (err) {
                    reject(new InsightError());
                }
            });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.reject("Not implemented.");
    }
}
