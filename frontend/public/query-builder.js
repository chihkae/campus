/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */

CampusExplorer.buildQuery = function () {
    // TODO: get data from courses panel
    let coursesPanel = document.getElementById("tab-courses");
    let coursesConditions = getConditions(coursesPanel);
    let coursesColumns = getCheckedColumnsOrGroupsCourses("courses", "columns");
    let coursesOrder = getOrder(coursesPanel, "courses");
    let coursesGroups = getCheckedColumnsOrGroupsCourses("courses", "groups");
    let coursesTransformations = getTransformations(coursesPanel);
    // TODO: get data from rooms panel
    let roomsPanel = document.getElementById("tab-rooms");
    let roomsConditions = getConditions(roomsPanel);
    let roomsColumns = getCheckedColumnsOrGroupsRooms("rooms", "columns");
    let roomsOrder = getOrder(roomsPanel, "rooms");
    let roomsGroups = getCheckedColumnsOrGroupsRooms("rooms", "groups");
    let roomsTransformations = getTransformations(roomsPanel);

    let query = formatQuery(coursesConditions, coursesColumns, coursesOrder, coursesGroups, coursesTransformations, roomsConditions, roomsColumns, roomsOrder, roomsGroups, roomsTransformations);
    return JSON.parse(query);
};

function formatQuery(coursesConditions, coursesColumns, coursesOrder, coursesGroups, coursesTransformations, roomsConditions, roomsColumns, roomsOrder, roomsGroups, roomsTransformations) {
    // TODO
    let query = `{"WHERE":${coursesConditions},` +
                `"OPTIONS":{"COLUMNS":[${validate(coursesColumns).toString()}],` +
                `"ORDER":${coursesOrder}}}`;

    function validate(input) {
        if (input === null) {
            return "";
        } else {
            return input;
        }
    }
    return query;
}

function getTransformations(panel) {
    let transformations = panel.getElementsByClassName("control-group transformation");
    if (transformations.length === 0) {
        return null;
    }
    let controlGroupTransformations = [];
    for (let transformation of transformations) {
        let transformationCondition = getControlTransformation(transformation, panel);
        controlGroupTransformations.push(transformationCondition);
    }
    return controlGroupTransformations;
}

function getControlTransformation(condition, panel) {
    let comparisonFields = panel.getElementsByClassName("control fields")[0].getElementsByTagName("option");
    let selectedCompField = Array.from(comparisonFields).filter(function (field) {
        return field.hasAttribute("selected");
    });
    let operators = panel.getElementsByClassName("control operators")[0].getElementsByTagName("option");
    let selectedOperator = Array.from(operators).filter(function (operator) {
        return operator.hasAttribute("selected");
    });
    let controlTerm = panel.getElementsByClassName("control term")[0].getElementsByTagName("input")[0].getAttribute("value");

    let operator = selectedOperator[0].getAttribute("value");
    let compField = selectedCompField[0].getAttribute("value");
    let toReturn = `{"${operator}":{"courses_${compField}": "${controlTerm}"}}`;
    return toReturn;
}

function getOrder(panel, datasetType) {
    let coursesOrder = panel.getElementsByClassName("control order fields")[0].getElementsByTagName("option");
    let toReturn = "";
    let selectedOrders = Array.from(coursesOrder).filter(function (order) {
        return order.hasAttribute("selected");
    });
    if (selectedOrders.length === 0) {
        return null;
    } else if (selectedOrders.length === 1) {
        toReturn = `"${datasetType}_${selectedOrders[0].getAttribute("value")}"`;
        return toReturn;
    } else {
        let descending = "";
        if (panel.getElementsByClassName("control descending")[0].getElementsByTagName("input")[0].hasAttribute("checked")) {
            descending = `"DOWN"`;
        } else {
            descending = `"UP"`;
        }
        toReturn = `{"dir":${descending},"keys":[`;
        selectedOrders.forEach(function (order, index) {
            if (selectedOrders.length > 1) {
                if (index !== selectedOrders.length - 1) {
                    toReturn += `"${datasetType}_${order.getAttribute("value")}"` + ",";
                } else if (index === selectedOrders.length - 1) {
                    toReturn += `"${datasetType}_${order.getAttribute("value")}"`
                }
            } else {
                toReturn += `"${datasetType}_${order.getAttribute("value")}"`;
            }
            // toReturn += `${order.getAttribute("value")}`;
        });
        // return `"${datasetType}_${toReturn}"`;
        return toReturn + "]}";
    }
}

function getConditions(panel) {
    let overallLogic = getOverallLogicCondition(panel);
    let controlGroupConditions = getControlGroupConditions(panel);
    if (controlGroupConditions === null) {
        return "{}";
    }
    //let toReturn = `${controlGroupConditions}`;
    let toReturn = "";
    controlGroupConditions.forEach((cond, index) => {
        let condAsString = cond;
        if (controlGroupConditions.length > 1) {
            if (index !== controlGroupConditions.length - 1) {
                toReturn += condAsString + ",";
            } else if (index === controlGroupConditions.length - 1) {
                toReturn += condAsString;
            }
        } else {
            toReturn += condAsString;
        }
    });
    if (controlGroupConditions.length > 1 && overallLogic !== "") {
        if (overallLogic === "AND" || overallLogic === "OR") {
            toReturn = `{"${overallLogic}":[${toReturn}]}`
        } else if (overallLogic === "NOT") {
            toReturn = `{"${overallLogic}":{${toReturn}}}`;
        }
    } else {
        toReturn = `${toReturn}`;
    }
    return toReturn;
}

function getOverallLogicCondition(panel) {
    let overallLogic = "";
    if (panel.getElementsByClassName("control conditions-all-radio")[0].getElementsByTagName("input")[0].hasAttribute("checked")) {
        overallLogic = "AND";
    }
    if (panel.getElementsByClassName("control conditions-any-radio")[0].getElementsByTagName("input")[0].hasAttribute("checked")) {
        overallLogic = "OR";
    }
    if (panel.getElementsByClassName("control conditions-none-radio")[0].getElementsByTagName("input")[0].hasAttribute("checked")) {
        overallLogic = "NOT";
    }
    return overallLogic;
}

function getControlGroupConditions(panel) {
    if (panel.getElementsByClassName("control-group condition").length > 0) {
        let conditions = panel.getElementsByClassName("control-group condition");
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
    } else {
        return null;
    }
}

function getControlCondition(condition) {
    let logic = "";
    if (condition.getElementsByClassName("control not")[0].getElementsByTagName("input")[0].hasAttribute("checked")) {
        logic = "NOT";
    }
    let comparisonFields = condition.getElementsByClassName("control fields")[0].getElementsByTagName("option");
    let selectedCompField = Array.from(comparisonFields).filter(function (field) {
        return field.hasAttribute("selected");
    });
    let operators = condition.getElementsByClassName("control operators")[0].getElementsByTagName("option");
    let selectedOperator = Array.from(operators).filter(function (operator) {
        return operator.hasAttribute("selected");
    });
    let controlTerm = condition.getElementsByClassName("control term")[0].getElementsByTagName("input")[0].getAttribute("value");

    let operator = selectedOperator[0].getAttribute("value");
    let compField = selectedCompField[0].getAttribute("value");
    let toReturn = "";
    if (compField === "avg" || compField === "pass" || compField === "fail" || compField === "audit" || compField === "year") {
        controlTerm = Number(controlTerm);
        toReturn = `{"${operator}":{"courses_${compField}": ${controlTerm}}}`;
    } else {
        toReturn = `{"${operator}":{"courses_${compField}": "${controlTerm}"}}`;
    }
    if (logic === "NOT") {
        toReturn = `{"${logic}":${toReturn}}`;
    }
    return toReturn;
}

function getCheckedColumnsOrGroupsRooms(datasetType, columnsOrGroups) {
    let checkedGroups = [];
    if (document.getElementById(`${datasetType}-${columnsOrGroups}-field-address`).hasAttribute("checked")) {
        checkedGroups.push(`"${datasetType}_address"`);
    }
    if (document.getElementById(`${datasetType}-${columnsOrGroups}-field-fullname`).hasAttribute("checked")) {
        checkedGroups.push(`"${datasetType}_fullname"`);
    }
    if (document.getElementById(`${datasetType}-${columnsOrGroups}-field-furniture`).hasAttribute("checked")) {
        checkedGroups.push(`"${datasetType}_furniture"`);
    }
    if (document.getElementById(`${datasetType}-${columnsOrGroups}-field-href`).hasAttribute("checked")) {
        checkedGroups.push(`"${datasetType}_href"`);
    }
    if (document.getElementById(`${datasetType}-${columnsOrGroups}-field-address`).hasAttribute("checked")) {
        checkedGroups.push(`"${datasetType}_address"`);
    }
    if (document.getElementById(`${datasetType}-${columnsOrGroups}-field-lat`).hasAttribute("checked")) {
        checkedGroups.push(`"${datasetType}_lat"`);
    }
    if (document.getElementById(`${datasetType}-${columnsOrGroups}-field-lon`).hasAttribute("checked")) {
        checkedGroups.push(`"${datasetType}_lon"`);
    }
    if (document.getElementById(`${datasetType}-${columnsOrGroups}-field-name`).hasAttribute("checked")) {
        checkedGroups.push(`"${datasetType}_name"`);
    }
    if (document.getElementById(`${datasetType}-${columnsOrGroups}-field-number`).hasAttribute("checked")) {
        checkedGroups.push(`"${datasetType}_number"`);
    }
    if (document.getElementById(`${datasetType}-${columnsOrGroups}-field-seats`).hasAttribute("checked")) {
        checkedGroups.push(`"${datasetType}_seats"`);
    }
    if (document.getElementById(`${datasetType}-${columnsOrGroups}-field-shortname`).hasAttribute("checked")) {
        checkedGroups.push(`"${datasetType}_shortname"`);
    }
    if (document.getElementById(`${datasetType}-${columnsOrGroups}-field-type`).hasAttribute("checked")) {
        checkedGroups.push(`"${datasetType}_type"`);
    }
    if (checkedGroups.length === 0) {
        return null;
    }
    return checkedGroups;
}


function getCheckedColumnsOrGroupsCourses(datasetType, columnsOrGroups) {
    let checkedColumns = [];
    if (document.getElementById(`${datasetType}-${columnsOrGroups}-field-audit`).hasAttribute("checked")) {
        checkedColumns.push(`"${datasetType}_audit"`);
    }
    if (document.getElementById(`${datasetType}-${columnsOrGroups}-field-avg`).hasAttribute("checked")) {
        checkedColumns.push(`"${datasetType}_avg"`);
    }
    if (document.getElementById(`${datasetType}-${columnsOrGroups}-field-dept`).hasAttribute("checked")) {
        checkedColumns.push(`"${datasetType}_dept"`);
    }
    if (document.getElementById(`${datasetType}-${columnsOrGroups}-field-fail`).hasAttribute("checked")) {
        checkedColumns.push(`"${datasetType}_fail"`);
    }
    if (document.getElementById(`${datasetType}-${columnsOrGroups}-field-id`).hasAttribute("checked")) {
        checkedColumns.push(`"${datasetType}_id"`);
    }
    if (document.getElementById(`${datasetType}-${columnsOrGroups}-field-instructor`).hasAttribute("checked")) {
        checkedColumns.push(`"${datasetType}_instructor"`);
    }
    if (document.getElementById(`${datasetType}-${columnsOrGroups}-field-pass`).hasAttribute("checked")) {
        checkedColumns.push(`"${datasetType}_pass"`);
    }
    if (document.getElementById(`${datasetType}-${columnsOrGroups}-field-title`).hasAttribute("checked")) {
        checkedColumns.push(`"${datasetType}_title"`);
    }
    if (document.getElementById(`${datasetType}-${columnsOrGroups}-field-uuid`).hasAttribute("checked")) {
        checkedColumns.push(`"${datasetType}_uuid"`);
    }
    if (document.getElementById(`${datasetType}-${columnsOrGroups}-field-year`).hasAttribute("checked")) {
        checkedColumns.push(`"${datasetType}_year"`);
    }
    if (checkedColumns.length === 0) {
        return null;
    }
    return checkedColumns;
}
