/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */

CampusExplorer.buildQuery = function() {
    let query = {};

    let checkedColumns = getCheckedColumns();
    console.log("checked columns: " + checkedColumns);
    let checkedGroups = getCheckedGroups();
    console.log("checked groups: " + checkedGroups);
    // TODO: implement!
    console.log("CampusExplorer.buildQuery not implemented yet.");

    return query;
};

function getConditions() {
    let overallLogic = getOverallLogicCondition();
}

function getControlGroupConditions() {
    if (document.getElementsByClassName("control-group condition").length > 0) {
        let conditions = document.getElementsByClassName("control-group condition");
        let length = conditions.length;
        for (let i = 0; i < length; i++) {
            let condition = conditions[i];
            let logic = "";
            if (condition.getElementsByClassName("control not")[0].getElementsByTagName("input")[0].hasAttribute("checked")) {
                logic = "NOT"
            }
            let comparison = "";
        }
    }
}

function getOverallLogicCondition() {
    let overallLogic = "";
    if (document.getElementById("courses-conditiontype-all").hasAttribute("checked")) {
        overallLogic = "AND";
    }
    if (document.getElementById("courses-conditiontype-any").hasAttribute("checked")) {
        overallLogic = "OR";
    }
    if (document.getElementById("courses-conditiontype-none").hasAttribute("checked")) {
        overallLogic = "NOT";
    }
    return overallLogic;
}

function getCheckedGroups() {
    let checkedGroups = [];
    if (document.getElementById("courses-groups-field-audit").hasAttribute("checked")) {
        checkedGroups.push("AUDIT");
    }
    if (document.getElementById("courses-groups-field-avg").hasAttribute("checked")) {
        checkedGroups.push("AVG");
    }
    if (document.getElementById("courses-groups-field-dept").hasAttribute("checked")) {
        checkedGroups.push("DEPT");
    }
    if (document.getElementById("courses-groups-field-fail").hasAttribute("checked")) {
        checkedGroups.push("FAIL");
    }
    if (document.getElementById("courses-groups-field-id").hasAttribute("checked")) {
        checkedGroups.push("ID");
    }
    if (document.getElementById("courses-groups-field-instructor").hasAttribute("checked")) {
        checkedGroups.push("INSTRUCTOR");
    }
    if (document.getElementById("courses-groups-field-pass").hasAttribute("checked")) {
        checkedGroups.push("PASS");
    }
    if (document.getElementById("courses-groups-field-title").hasAttribute("checked")) {
        checkedGroups.push("TITLE");
    }
    if (document.getElementById("courses-groups-field-uuid").hasAttribute("checked")) {
        checkedGroups.push("UUID");
    }
    if (document.getElementById("courses-groups-field-year").hasAttribute("checked")) {
        checkedGroups.push("YEAR");
    }
    return checkedGroups;
}


function getCheckedColumns() {
    let checkedColumns = [];
    if (document.getElementById("courses-columns-field-audit").hasAttribute("checked")) {
        checkedColumns.push("AUDIT");
    }
    if (document.getElementById("courses-columns-field-avg").hasAttribute("checked")) {
        checkedColumns.push("AVG");
    }
    if (document.getElementById("courses-columns-field-dept").hasAttribute("checked")) {
        checkedColumns.push("DEPT");
    }
    if (document.getElementById("courses-columns-field-fail").hasAttribute("checked")) {
        checkedColumns.push("FAIL");
    }
    if (document.getElementById("courses-columns-field-id").hasAttribute("checked")) {
        checkedColumns.push("ID");
    }
    if (document.getElementById("courses-columns-field-instructor").hasAttribute("checked")) {
        checkedColumns.push("INSTRUCTOR");
    }
    if (document.getElementById("courses-columns-field-pass").hasAttribute("checked")) {
        checkedColumns.push("PASS");
    }
    if (document.getElementById("courses-columns-field-title").hasAttribute("checked")) {
        checkedColumns.push("TITLE");
    }
    if (document.getElementById("courses-columns-field-uuid").hasAttribute("checked")) {
        checkedColumns.push("UUID");
    }
    if (document.getElementById("courses-columns-field-year").hasAttribute("checked")) {
        checkedColumns.push("YEAR");
    }
    return checkedColumns;
}
