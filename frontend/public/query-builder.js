/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */

CampusExplorer.buildQuery = function () {
    let conditions = getConditions();
    let checkedColumns = getCheckedColumns();
    let order = getOrder();
    let checkedGroups = getCheckedGroups();
    let transformations = getTransformations();

    let query = `{"WHERE":${conditions},"OPTIONS":{"COLUMNS":[${checkedColumns.toString()}],"ORDER":${order}}}`;

    return JSON.parse(query);
};

function getTransformations() {
    let transformations = document.getElementsByClassName("control-group transformation");

}

function getOrder() {
    let coursesOrder = document.getElementsByClassName("control order fields")[0].getElementsByTagName("option");
    let selectedOrders = Array.from(coursesOrder).filter(function (order) {
        return order.hasAttribute("selected");
    });
    if (selectedOrders.length === 0) {
        return null;
    } else {
        let toReturn = "";
        selectedOrders.forEach(function (order) {
            toReturn += `${order.getAttribute("value")}`;
        });
        return `"courses_${toReturn}"`;
    }
    //let descending = document.getElementsByClassName("control descending")[0].getElementsByTagName("input").hasAttribute("checked");
}

function getConditions() {
    let overallLogic = getOverallLogicCondition();
    let controlGroupConditions = getControlGroupConditions();
    if (controlGroupConditions === null) {
        // TODO;
    }
    //let toReturn = `${controlGroupConditions}`;
    let toReturn = "";
    controlGroupConditions.forEach((cond) => {
        let condAsString = cond;
        toReturn += condAsString;
    });
    if (controlGroupConditions.length > 1 && overallLogic !== "") {
        toReturn = `{"${overallLogic}":${toReturn}}`;
    } else {
        toReturn = `${toReturn}`;
    }
    return toReturn;
}

function getControlGroupConditions() {
    if (document.getElementsByClassName("control-group condition").length > 0) {
        let conditions = document.getElementsByClassName("control-group condition");
        let length = conditions.length;
        if (length === 0) {
            return null;
        }
        let controlGroupConditions = [];
        for (let i = 0; i < length; i++) {
            let condition = conditions[i];
            let controlCondition = getControlCondition(condition);
            controlGroupConditions.push(controlCondition);
        }
        return controlGroupConditions;
    }
}

function getControlCondition(condition) {
    let logic = "";
    if (condition.getElementsByClassName("control not")[0].getElementsByTagName("input")[0].hasAttribute("checked")) {
        logic = "NOT";
    }
    let comparisonFields = document.getElementsByClassName("control fields")[0].getElementsByTagName("option");
    let selectedCompField = Array.from(comparisonFields).filter(function (field) {
        return field.hasAttribute("selected");
    });
    let operators = document.getElementsByClassName("control operators")[0].getElementsByTagName("option");
    let selectedOperator = Array.from(operators).filter(function (operator) {
        return operator.hasAttribute("selected");
    });
    let controlTerm = document.getElementsByClassName("control term")[0].getElementsByTagName("input")[0].getAttribute("value");

    let operator = selectedOperator[0].getAttribute("value");
    let compField = selectedCompField[0].getAttribute("value");
    let toReturn = `{"${operator}":{"courses_${compField}": "${controlTerm}"}}`;
    if (logic === "NOT") {
        toReturn = `{"${logic}":${toReturn}}`;
    }
    return toReturn;
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

function getCheckedGroups(datasetType) {
    let checkedGroups = [];
    if (document.getElementById("courses-groups-field-audit").hasAttribute("checked")) {
        checkedGroups.push("AUDIT");
    }
    if (document.getElementById("courses-groups-field-avg").hasAttribute("checked")) {
        checkedGroups.push("AVG");
    }
    if (document.getElementById("courses-groups-field-dept").hasAttribute("checked")) {
        checkedGroups.push(`"courses_dept"`);
    }
    if (document.getElementById("courses-groups-field-fail").hasAttribute("checked")) {
        checkedGroups.push("FAIL");
    }
    if (document.getElementById("courses-groups-field-id").hasAttribute("checked")) {
        checkedGroups.push(`"courses_id"`);
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


function getCheckedColumns(datasetType) {
    let checkedColumns = [];
    if (document.getElementById("courses-columns-field-audit").hasAttribute("checked")) {
        checkedColumns.push("AUDIT");
    }
    if (document.getElementById("courses-columns-field-avg").hasAttribute("checked")) {
        checkedColumns.push("AVG");
    }
    if (document.getElementById("courses-columns-field-dept").hasAttribute("checked")) {
        checkedColumns.push(`"courses_dept"`);
    }
    if (document.getElementById("courses-columns-field-fail").hasAttribute("checked")) {
        checkedColumns.push("FAIL");
    }
    if (document.getElementById("courses-columns-field-id").hasAttribute("checked")) {
        checkedColumns.push(`"courses_id"`);
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
