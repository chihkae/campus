import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import {expect} from "chai";
import {error} from "util";
import Log from "../src/Util";
import {InsightDataset, InsightDatasetKind} from "../src/controller/IInsightFacade";
import * as fs from "fs-extra";


describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;
    const cacheDir = __dirname + "/../data";


    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        server.start().catch((reason: any) => {
            alert(reason);
        });
        // TODO: start server here once and handle errors properly
    });

    after(function () {
        server.stop().then((success: boolean) => {
            Log.info("server closed succesfully");
        }).catch((err: any) => {
            Log.info("server not closed succesfully");
        });
        // TODO: stop server here once!
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
        } catch (err) {
            Log.error(err);
        }
        // might want to add some process logging here to keep track of what"s going on
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    // TODO: read your courses and rooms datasets here once!

    // Sample on how to format PUT requests
    it("PUT test for courses dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses/" + InsightDatasetKind.Courses)
                .send(fs.readFileSync(`./data/courses.zip`))
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.info("succesfully added dataset");
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.info("couldn't add dataset");
                    expect(err.status).to.be.equal(400);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });


    it("PUT test for dataset with underscore id", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/under_score/" + InsightDatasetKind.Courses)
                .send(fs.readFileSync(`./data/under_score.zip`))
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    expect.fail("shouldn't be allowed to add dataset with underscore in id");
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.info("couldn't add dataset because of underscore in id");
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("GET test for courses dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses/" + InsightDatasetKind.Courses)
                .send(fs.readFileSync(`./data/courses.zip`).toString("base64"))
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.info("succesfully added dataset and now getting it");
                    return chai.request("http://localhost:4321").get("/datasets");
                })
                .catch(function (err) {
                    Log.info("didn't succesfully add dataset");
                }).
                then(function (res: Response) {
                    let expected: InsightDataset[] = [];
                    const coursesDataset = {} as InsightDataset;
                    coursesDataset.id = "courses";
                    coursesDataset.kind = InsightDatasetKind.Courses;
                    coursesDataset.numRows = 64612;
                    expected.push(coursesDataset);
                    expect(res.body).to.be.equal(expected);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.info("didn't succesfully get all teh datasets added");
                    expect(err.status).to.be.equal(400);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("Delete test for courses dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses/" + InsightDatasetKind.Courses)
                .send(fs.readFileSync(`./data/courses.zip`))
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                // some logging here please!
                    Log.info("succesfully added dataset and now getting it");
                    return chai.request("http://localhost:4321")
                        .del("/datasets/courses");
                })
                .catch(function (err) {
                    Log.info("didn't succesfully delete dataset");
                }).
                then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.deep.equal("courses");
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("Delete test for unadded courses dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/courses")
                .then(function (res: Response) {
                    // some logging here please!
                    expect.fail("shouldn't be allowed to delete from empty dataset");
                })
                .catch(function (err) {
                    expect(err.status).to.deep.equal(404);
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("Delete test for dataset id with underscore", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/")
                .query({id: "courses"})
                .then(function (res: Response) {
                    // some logging here please!
                    expect.fail("shouldn't be allowed to delete dataset with underscore in id");
                })
                .catch(function (err) {
                    Log.info("Couldn't be deleted because of underline in id");
                    expect(err.status).to.deep.equal(400);
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("POST test for courses query", function () {
        try {
            let toSend: object = {
                WHERE: {
                    IS: {courses_uuid: "5034*"}
                },
                OPTIONS: {
                    COLUMNS: [
                        "courses_title",
                        "courses_avg",
                        "courses_uuid"
                    ],
                    ORDER: "courses_avg"
                }
            };
            return chai.request("http://localhost:4321")
                .put("/dataset/")
                .query({id: "courses", kind: InsightDatasetKind.Courses})
                .send(fs.readFileSync(`./data/courses.zip`))
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.info("succesfully added dataset");
                    return chai.request("http://localhost:4321")
                        .post("/query")
                        .send(toSend)
                        .catch(function (err) {
                                expect.fail("shouldn't fail a query on a dataset that has been added");
                        });
                }).catch(function (err) {
                    // some logging here please!
                    Log.info("couldn't add dataset");
                    expect(err.status).to.be.equal(400);
                    expect.fail();
                })
                .then(function (result) {
                    expect(result.body).to.have.length(7);
                    // expect(result.body).to.have.members([
                    //     {
                    //         courses_title: "vikings & myth",
                    //         courses_avg: 77.01,
                    //         courses_uuid: "50348"
                    //     },
                    //     {
                    //         courses_title: "vikings & myth",
                    //         courses_avg: 77.01,
                    //         courses_uuid: "50349"
                    //     },
                    //     {
                    //         courses_title: "major scan lit",
                    //         courses_avg: 84.3,
                    //         courses_uuid: "50346"
                    //     },
                    //     {
                    //         courses_title: "major scan lit",
                    //         courses_avg: 84.3,
                    //         courses_uuid: "50347"
                    //     },
                    //     {
                    //         courses_title: "physcal cosmolgy",
                    //         courses_avg: 84.92,
                    //         courses_uuid: "50342"
                    //     },
                    //     {
                    //         courses_title: "physcal cosmolgy",
                    //         courses_avg: 84.92,
                    //         courses_uuid: "50343"
                    //     },
                    //     {
                    //         courses_title: "arch design v",
                    //         courses_avg: 86.86,
                    //         courses_uuid: "5034"
                    //     }
                    // ]);
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("POST test for query without dataset added", function () {
        try {
            return chai.request("http://localhost:4321")
                .post("/query")
                .send(
                    {
                        WHERE: {
                            IS: { courses_uuid: "5034*"}
                            },
                        OPTIONS: {
                            COLUMNS: [
                                "courses_title",
                                "courses_avg",
                                "courses_uuid"
                            ],
                            ORDER: "courses_avg"
                        }
                    }).catch(function (err) {
                        expect(err.status).to.be.equal(400);
                    }).then( function (result) {
                        expect.fail("shouldnt be allowed to perform query on a dataset that hasn't been added");
                    });
        } catch (err) {
            // and some more logging here!
        }
    });


    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
