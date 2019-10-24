import {expect} from "chai";
import * as fs from "fs-extra";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";
import {getGeoLocation, getGeoResponse} from "../src/controller/DomTraverser";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}

describe("InsightFacade Add/Remove Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        emptyCourse: "./test/data/emptyCourse.zip",
        invalid: "./test/data/invalid.zip",
        blankTxtFile: "./test/data/blankTxtFile.zip",
        oneCourse: "./test/data/oneCourse.zip",
        resultsNull: "./test/data/resultsNull.zip",
        under_score: "./test/data/under_score.zip",
        jpg: "./test/data/RBC Cheque Image.jpg",
        rooms: "./test/data/rooms.zip"
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
        }
    });

    beforeEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs before each test, which should make each test independent from the previous one
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // This is a unit test. You should create more like this!
    it("Should add a valid dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("test adding one course", function () {
        const id: string = "oneCourse";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("test adding multiple courses", function () {
        const oneCourse: string = "oneCourse";
        const courses: string = "courses";
        const expected: string[] = [courses, oneCourse];
        insightFacade.addDataset(oneCourse, datasets[oneCourse], InsightDatasetKind.Courses)
            .then((result: string[]) => {
            expect(result).to.deep.equal([oneCourse]);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
        return insightFacade.addDataset(courses, datasets[courses], InsightDatasetKind.Courses)
            .then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("test adding an empty course", function () {
        const id: string = "emptyCourse";
        insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail();
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
            expect(err.message).to.deep.equal("Error: There were no courses, or there were no sections");
        });
    });

    it("test adding an invalid course", function () {
        const id: string = "invalid";
        insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail();
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
            expect(err.message).to.equal("Error: There were no courses, or there were no sections");
        });
    });

    it("test adding an empty file", function () {
        const id: string = "blankTxtFile";
        insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail();
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
            expect(err.message).to.equal("Error: There were no courses, or there were no sections");
        });
    });

    it("test adding a non-zip file", function () {
        const id: string = "jpg";
        insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail();
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
            expect(err.message).to.contain("is this a zip file ?");
        });
    });

    it("test adding a dataset with null for results", function () {
        const id: string = "resultsNull";
        insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail();
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
            expect(err.message).to.equal("Error: There were no courses, or there were no sections");
        });
    });

    it("test adding a dataset with an underscore in id", function () {
        const id: string = "under_score";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            // should return empty array, since id has an underscore
            expect.fail();
        }).catch((err: InsightError) => {
            expect(err).to.be.instanceOf(InsightError);
            expect(err.message).to.equal("id is invalid");
        });
    });

    it("test adding a dataset with whitespace id", function () {
        const id: string = " ";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            // should return empty array, since id is invalid
            expect.fail();
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
            expect(err.message).to.equal("id is invalid");
        });
    });

    it("test adding a dataset with null as an id", function () {
        const id: string = null;
        const expected: string[] = [];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            // should return empty array, since id is invalid
            expect.fail();
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
            expect(err.message).to.equal("id is invalid");
        });
    });

    it("test adding a valid rooms dataset", function () {
        const id: string = "rooms";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it ("test getting lat and lon", function () {
        let address = "1866 Main Mall";
        return getGeoLocation(address).then((result: any) => {
            Log.info(result);
            expect(result.lat).to.equal(49.26826);
            expect(result.lon).to.equal(-123.25468);
            expect(result.error).to.equal(undefined);
        }).catch((err: any) => {
            Log.error(err);
        });
    });

    it("test removing a dataset when there are no datasets added", function () {
        return insightFacade.removeDataset("doesn't matter").then((result: string) => {
            expect.fail();
        }).catch((err: InsightError) => {
            expect(err).to.be.instanceOf(NotFoundError);
            expect(err.message).to.equal("A dataset with a corresponding Id has already been added");
        });
    });

    it("test removing a dataset using invalid id", function () {
        return insightFacade.removeDataset("foo_bar").then((result: string) => {
            expect.fail();
        }).catch((err: InsightError) => {
            expect(err).to.be.instanceOf(InsightError);
            expect(err.message).to.equal("id is invalid");
        });
    });

    it("test removing one dataset", function () {
        const id: string = "oneCourse";
        const expected: string = id;
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then(() => {
            return insightFacade.removeDataset(id).then((result: string) => {
                expect(result).to.deep.equal(expected);
            });
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("test listDatasets with no datasets added", function () {
        const expected: InsightDataset[] = [];
        return insightFacade.listDatasets().then((result: InsightDataset[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail();
        });
    });

    it("test listDatasets with one dataset added", function () {
        const id: string = "oneCourse";
        let expected: InsightDataset[] = [];
        const oneCourseDataset = {} as InsightDataset;
        oneCourseDataset.id = "oneCourse";
        oneCourseDataset.kind = InsightDatasetKind.Courses;
        oneCourseDataset.numRows = 1;
        expected.push(oneCourseDataset);
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then(() => {
            return insightFacade.listDatasets().then((result: InsightDataset[]) => {
                expect(result).to.deep.equal(expected);
            }).catch((err: any) => {
                expect.fail();
            });
        });
    });

    it("test listDatasets with two datasets added", function () {
        let expected: InsightDataset[] = [];

        const courses: string = "courses";
        const coursesDataset = {} as InsightDataset;
        coursesDataset.id = "courses";
        coursesDataset.kind = InsightDatasetKind.Courses;
        coursesDataset.numRows = 64612;
        expected.push(coursesDataset);

        const oneCourse: string = "oneCourse";
        const oneCourseDataset = {} as InsightDataset;
        oneCourseDataset.id = "oneCourse";
        oneCourseDataset.kind = InsightDatasetKind.Courses;
        oneCourseDataset.numRows = 1;
        expected.push(oneCourseDataset);

        insightFacade.addDataset(oneCourse, datasets[oneCourse], InsightDatasetKind.Courses);
        return insightFacade.addDataset(courses, datasets[courses], InsightDatasetKind.Courses).then(() => {
            return insightFacade.listDatasets().then((result: InsightDataset[]) => {
                expect(result).to.deep.equal(expected);
            }).catch((err: any) => {
                expect.fail();
            });
        });
    });

});

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */

describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: any } = {
        courses: {id: "courses", path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        insightFacade = new InsightFacade();
        for (const key of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[key];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(ds.id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // it("Should run test queries", function () {
    //     describe("Dynamic InsightFacade PerformQuery tests", function () {
    //         for (const test of testQueries) {
    //             if (test.filename === "test/queries/1.json") {
    //                 it("dfdfd", function (done) {
    //                         insightFacade.performQuery(test.query).then((result) => {
    //                             TestUtil.checkQueryResult(test, result, done);
    //                         }).catch((err) => {
    //                             TestUtil.checkQueryResult(test, err, done);
    //                         });
    //                 });
    //             }
    //         }
    //     });
    // });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function (done) {
                    insightFacade.performQuery(test.query).then((result) => {
                        TestUtil.checkQueryResult(test, result, done);
                    }).catch((err) => {
                        TestUtil.checkQueryResult(test, err, done);
                    });
                });
            }
        });
    });
});
