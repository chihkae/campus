import Log from "../Util";
import {Room, Building} from "./Dataset";

export function extractRoomData(document: Node, filename: string): any {
    let domNodes: Node[] = getAllNodes(document);
    if (domNodes.length <= 0) {
        return undefined;
    }
    let fullName: string = getFullName(domNodes);
    // get all of the "tr" (table row) nodes
    let trNodes: Node[] = getTrNodes(domNodes);
    if (trNodes.length <= 0) {
        return undefined;
    }
    // from each table row, get table data ("td" nodes)
    // the td nodes are the childNodes of the tr nodes
    let tdNodes: any[] = getTdNodesFromTrNodes(trNodes);
    if (tdNodes.length <= 0) {
        return undefined;
    }
    // create a new room from each of the table data nodes
    let rooms: Room[] = [];
    tdNodes.forEach((tdNodeChildren: []) => {
        let room: Room = new Room();

        tdNodeChildren.forEach((child) => {
            if (hasAttribute(child, "room-number")) {
                let childNodeA = getGivenChildNodes(child, "a");
                // the room-number node also holds the href value
                room.href = getAttribute(childNodeA[0], "href").value;
                let childNodeRoomNumber = getGivenChildNodes(childNodeA[0], "#text");
                room.number = childNodeRoomNumber[0].value.trim();
            }
            if (hasAttribute(child, "room-capacity")) {
                let childNode: any[] = getGivenChildNodes(child, "#text");
                room.seats = childNode[0].value.trim();
            }
            if (hasAttribute(child, "room-furniture")) {
                let childNode: any[] = getGivenChildNodes(child, "#text");
                room.furniture = childNode[0].value.trim();
            }
            if (hasAttribute(child, "room-type")) {
                let childNode: any[] = getGivenChildNodes(child, "#text");
                room.type = childNode[0].value.trim();
            }
        });
        let buildingAbbrev = filename.substring(filename.lastIndexOf("/") + 1);
        room.shortname = buildingAbbrev;
        room.fullname = fullName;
        room.name = room.shortname + "_" + room.number;
        rooms.push(room);
    });
    // delete every other room, fix this later // TODO
    rooms = rooms.filter(function (room, i) {
        return (i + 1) % 2 !== 0;
    });
    return rooms;
}

function getFullName(domNodes: any[]) {
    let fullName: string;
    domNodes.forEach((node) => {
        if (node.nodeName === "h2") {
            let spanNodes = getGivenChildNodes(node, "span");
            if (spanNodes.length === 1 && hasAttribute(spanNodes[0], "field-content")) {
                fullName = spanNodes[0].childNodes[0].value;
            }
        }
    });
    return fullName;
}

function getTrNodes(domNodes: any[]) {
    let trNodes: Node[] = [];
    domNodes.forEach((node) => {
        if (node.nodeName === "tr") {
            trNodes.push(node);
        }
    });
    return trNodes;
}

function getTdNodesFromTrNodes(trNodes: any[]) {
    let tdNodes: any[] = [];
    trNodes.forEach((trNode) => {
        let trChilds = getGivenChildNodes(trNode, "td");
        if (trChilds.length > 0) {
            tdNodes.push(trChilds);
        }
    });
    return tdNodes;
}

export function extractBuildingData(document: Node): Building[] {
    let domNodes: Node[] = getAllNodes(document);
    // get all of the "tr" (table row) nodes
    let trNodes: Node[] = [];
    domNodes.forEach((node) => {
        if (node.nodeName === "tr") {
            trNodes.push(node);
        }
    });
    // from each table row, get table data ("td" nodes)
    // the td nodes are the childNodes of the tr nodes
    let tdNodes: any[] = [];
    trNodes.forEach((trNode) => {
        let trChilds = getGivenChildNodes(trNode, "td");
        if (trChilds.length > 0) {
            tdNodes.push(trChilds);
        }
    });
    // create a new Building from each of the table data nodes.
    let buildings: Building[] = [];
    tdNodes.forEach((tdNodeChildren: []) => {
        let building: Building = new Building();

        tdNodeChildren.forEach((child) => {
            if (hasAttribute(child, "building-code")) {
                let childNode: any[] = getGivenChildNodes(child, "#text");
                building.shortname = childNode[0].value.trim();
            }
            if (hasAttribute(child, "building-address")) {
                let childNode: any[] = getGivenChildNodes(child, "#text");
                building.address = childNode[0].value.trim();
            }
        });
        buildings.push(building);
    });

    // delete every other room, fix this later // TODO
    buildings = buildings.filter(function (building, i) {
        return (i + 1) % 2 !== 0;
    });

    return buildings;
}

function hasAttribute(node: any, attributeValue: string): boolean {
    let attributes: any[] = node.attrs;

    for (let attribute of attributes) {
        if (attribute.value === attributeValue || attribute.value.toString().includes(attributeValue)) {
            return true;
        }
    }

    return false;
}

function getAttribute(node: any, attributeName: string) {
    let attributes: any[] = node.attrs;

    for (let attribute of attributes) {
        if (attribute.name === attributeName || attribute.name.toString().includes(attributeName)) {
            return attribute;
        }
    }

    return undefined;
}

function getGivenChildNodes(node: any, nodeName: string): any[] {
    let childNodes: any[] = node.childNodes;
    let childNodesToReturn: any[] = [];

    for (let childNode of childNodes) {
        if (childNode.nodeName === nodeName) {
            childNodesToReturn.push(childNode);
        }
    }

    return childNodesToReturn;
}

// recursively retrieves all the nodes from the DOM
function getAllNodes(root: Node): Node[] {
    let nodes: Node[] = [];

    if (root.childNodes !== undefined) {
        let i;
        for (i = 0; i < root.childNodes.length; i++) {
            if (root.childNodes[i] !== undefined) {
                let temp = root.childNodes[i];
                nodes.push(temp);
            }
            let nodesToPush = getAllNodes(root.childNodes[i]);
            nodesToPush.map((n) => {
                nodes.push(n);
            });
        }
    }
    nodes.push(root);

    return nodes;
}

export function getGeoResponse(address: string): Promise<any> {
    const http = require("http");
    let uriEncodedAddress = encodeURIComponent(address);
    let url: string = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team219/" + address;
    return http.get(url, function (res: any) {
        if (res.error) {
            Log.error(res.error);
        }
        Log.info(res.lat);
        Log.info(res.lon);
        return Promise.resolve(res);
    });
}
