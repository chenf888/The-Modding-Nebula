var canvas;
var ctx;

// MTGA: layer-tree branches are rendered as SVG lines inside the zoomable
// tree plane (see treeView.js). The fullscreen canvas is kept only as a
// fallback for component branches (upgrade-tree, buyable-tree, etc.) that
// live on regular layer pages. resizeCanvas() stays the engine-wide update
// hook used by the rest of the code.

var treeLines = []

window.addEventListener("resize", (_ => { resizeCanvas(); if (treePlaneEl()) fitTree() }));

function retrieveCanvasData() {
	let treeCanv = document.getElementById("treeCanvas")
	if (treeCanv===undefined||treeCanv===null) return false;
	canvas = treeCanv;
	ctx = canvas.getContext("2d");
	return true;
}

function resizeCanvas() {
	updateTreeLines();
	drawTree();
}

function updateTreeLines() {
	// Only the tree overview page has a plane to draw lines in
	if (!treePlaneEl()) return
	setTreeLines(computeTreeLines())
}

function setTreeLines(lines) {
	treeLines = lines
	if (typeof app !== "undefined" && app) app.treeLines = lines
}

// Branches between the tree's nodes, in plane-local coordinates
function computeTreeLines() {
	let plane = treePlaneEl()
	if (!plane) return []
	let s = treeView.scale || 1
	let pr = plane.getBoundingClientRect()
	let center = el => {
		let r = el.getBoundingClientRect();
		return { x: (r.left + r.width / 2 - pr.left) / s, y: (r.top + r.height / 2 - pr.top) / s }
	}
	let lines = []
	let addBranch = function(num1, data, prefix) {
		let num2 = data
		let color_id = 1
		let width = 15
		if (Array.isArray(data)){
			num2 = data[0]
			color_id = data[1]
			width = data[2] || width
		}
		if(typeof(color_id) == "number")
			color_id = colors_theme[color_id]
		if (prefix) {
			num1 = prefix + num1
			num2 = prefix + num2
		}
		let e1 = document.getElementById(num1)
		let e2 = document.getElementById(num2)
		if (e1 == null || e2 == null) return
		let a = center(e1)
		let b = center(e2)
		lines.push({x1: a.x, y1: a.y, x2: b.x, y2: b.y, color: color_id, width: width})
	}
	for (layer in layers){
		if (tmp[layer].layerShown == true && tmp[layer].branches){
			for (branch in tmp[layer].branches)
				addBranch(layer, tmp[layer].branches[branch])
		}
		computeComponentBranches(layer, tmp[layer].upgrades, "upgrade-", addBranch)
		computeComponentBranches(layer, tmp[layer].buyables, "buyable-", addBranch)
		computeComponentBranches(layer, tmp[layer].clickables, "clickable-", addBranch)
	}
	return lines
}

// Branches between components (upgrade-trees and friends) that appear on
// regular pages; these are still drawn on the fullscreen canvas.
function computeComponentBranches(layer, data, prefix, addBranch) {
	for(id in data) {
		if (data[id].branches) {
			for (branch in data[id].branches)
				addBranch(id, data[id].branches[branch], prefix + layer + "-")
		}
	}
}

function drawTree() {
	if (!retrieveCanvasData()) return;
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (layer in layers){
		drawComponentBranches(layer, tmp[layer].upgrades, "upgrade-")
		drawComponentBranches(layer, tmp[layer].buyables, "buyable-")
		drawComponentBranches(layer, tmp[layer].clickables, "clickable-")
	}
}

function drawComponentBranches(layer, data, prefix) {
	for(id in data) {
		if (data[id].branches) {
			for (branch in data[id].branches)
			{
				drawTreeBranch(id, data[id].branches[branch], prefix + layer + "-")
			}
		}
	}
}

function drawTreeBranch(num1, data, prefix) { // taken from Antimatter Dimensions & adjusted slightly
	let num2 = data
	let color_id = 1
	let width = 15
	if (Array.isArray(data)){
		num2 = data[0]
		color_id = data[1]
		width = data[2] || width
	}

	if(typeof(color_id) == "number")
		color_id = colors_theme[color_id]
	if (prefix) {
		num1 = prefix + num1
		num2 = prefix + num2
	}
	if (document.getElementById(num1) == null || document.getElementById(num2) == null)
		return

	let start = document.getElementById(num1).getBoundingClientRect();
    let end = document.getElementById(num2).getBoundingClientRect();
    let x1 = start.left + (start.width / 2) + document.body.scrollLeft;
    let y1 = start.top + (start.height / 2) + document.body.scrollTop;
    let x2 = end.left + (end.width / 2) + document.body.scrollLeft;
    let y2 = end.top + (end.height / 2) + document.body.scrollTop;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.strokeStyle = color_id
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}
