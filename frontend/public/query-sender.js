/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function (query) {
    return new Promise(function (fulfill, reject) {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost:4321/query", true);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onload = function () {
            xhr.onreadystatechange = function () {
                if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
                    Log.info("success");
                    return fulfill(this.responseText);
                } else if (this.readyState == XMLHttpRequest.DONE && this.status >= 400) {
                    Log.info("failure");
                    return reject(this.statusText);
                }
            }
        }
        xhr.send(JSON.stringify(query));

    });
};
