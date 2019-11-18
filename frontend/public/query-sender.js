/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function (query) {
    return new Promise(function (fulfill, reject) {
        let xhttp = new XMLHttpRequest();
        xhttp.open("POST", "http://localhost:4321/query", true);
        xhttp.setRequestHeader("Content-type", "application/json");
        xhttp.send(JSON.stringify(query));

        xhttp.onreadystatechange = function () {
            if(this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                fulfill(CampusExplorer.renderResult(JSON.parse(xhttp.responseText)));
            }else if(this.readyState === XMLHttpRequest.DONE && this.status >= 400){
                reject(CampusExplorer.renderResult(xhttp.statusText));
            }
        }
    });
};
