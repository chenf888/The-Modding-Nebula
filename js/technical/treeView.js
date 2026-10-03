// ************ Tree View (pan/zoom overview page) ************
// MTGA replaces the fixed, screen-locked tree with a pannable and zoomable
// overview page. Nodes stay ordinary tree-node buttons (so developer styles
// keep working), but they live inside a transformed plane; branch lines are
// drawn as SVG inside that plane, so they follow zoom/pan automatically.

var treeView = {
	scale: 1,
	x: 0,
	y: 0,
	minScale: 0.15,
	maxScale: 3,
	fitScale: 1.25, // fitting never zooms in past this
}

function treeViewportEl() { return document.getElementById("treeTab") }
function treePlaneEl() { return document.getElementById("treePlane") }

// Sidebar tooltips are fixed-positioned next to their node; keep them glued
// when the sidebar itself scrolls.
function updateSidebarTips() {
	let hovered = document.querySelector("#sidebar .tooltipBox:hover")
	if (!hovered) return
	let r = hovered.getBoundingClientRect()
	let tip = hovered.querySelector(".tooltip")
	if (!tip) return
	tip.style.position = "fixed"
	tip.style.left = Math.round(r.right + 12) + "px"
	tip.style.top = Math.round(r.top + r.height / 2) + "px"
	tip.style.transform = "translateY(-50%)"
	tip.style.bottom = "auto"
	tip.style.margin = "0"
}

function zoomTree(factor, mx, my) {
	let vp = treeViewportEl()
	if (!vp) return
	let old = treeView.scale
	let s = Math.min(treeView.maxScale, Math.max(treeView.minScale, old * factor))
	if (s === old) return
	let px = (mx - treeView.x) / old
	let py = (my - treeView.y) / old
	treeView.scale = s
	treeView.x = mx - px * s
	treeView.y = my - py * s
}

// Bounding box of all visible nodes, in plane-local coordinates
function treeContentBounds() {
	let plane = treePlaneEl()
	if (!plane) return null
	let s = treeView.scale || 1
	let pr = plane.getBoundingClientRect()
	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
	let nodes = plane.querySelectorAll(".treeNode:not(.hidden):not(.ghost), .treeButton:not(.hidden):not(.ghost)")
	for (let n of nodes) {
		let r = n.getBoundingClientRect()
		if (!r.width && !r.height) continue
		minX = Math.min(minX, (r.left - pr.left) / s)
		minY = Math.min(minY, (r.top - pr.top) / s)
		maxX = Math.max(maxX, (r.right - pr.left) / s)
		maxY = Math.max(maxY, (r.bottom - pr.top) / s)
	}
	if (minX === Infinity) return null
	return { minX, minY, maxX, maxY }
}

function fitTree() {
	let vp = treeViewportEl()
	if (!vp) return
	let b = treeContentBounds()
	if (!b) {
		treeView.scale = 1
		treeView.x = 0
		treeView.y = 0
		return
	}
	let vpr = vp.getBoundingClientRect()
	let pad = 40
	let cx = (b.minX + b.maxX) / 2
	let cy = (b.minY + b.maxY) / 2
	let w = b.maxX - b.minX + pad * 2
	let h = b.maxY - b.minY + pad * 2
	let target = Math.min(vpr.width / w, vpr.height / h)
	treeView.scale = Math.max(treeView.minScale, Math.min(treeView.fitScale, target))
	treeView.x = vpr.width / 2 - cx * treeView.scale
	treeView.y = vpr.height / 2 - cy * treeView.scale
}

Vue.component('tree-view', {
	data() { return { view: treeView, dragging: false } },
	props: { lines: { default: () => [] } },
	template: `
	<div id="treeTab" class="treeViewport" v-bind:class="{dragging: dragging}"
		v-on:wheel.prevent="onWheel"
		v-on:mousedown="onDown"
		v-on:touchstart="onTouchStart"
		v-on:touchmove.prevent="onTouchMove"
		v-on:touchend="onTouchEnd"
		v-on:touchcancel="onTouchEnd">
		<div id="treePlane" class="treePlane instant" v-bind:style="planeStyle">
			<svg class="treeBranches">
				<line v-for="(l, i) in lines" :key="'tl' + i"
					:x1="l.x1" :y1="l.y1" :x2="l.x2" :y2="l.y2"
					v-bind:style="{stroke: l.color, 'stroke-width': l.width + 'px'}" stroke-linecap="round"/>
			</svg>
			<div class="treeContent"><slot></slot></div>
		</div>
		<div class="treeControls">
			<button class="treeCtrl can" v-on:click="zoomStep(1.3)">+</button>
			<button class="treeCtrl can" v-on:click="zoomStep(1/1.3)">-</button>
			<button class="treeCtrl can" v-on:click="fitTree()">&#10530;</button>
		</div>
	</div>
	`,
	computed: {
		planeStyle() {
			return { transform: 'translate(' + this.view.x + 'px, ' + this.view.y + 'px) scale(' + this.view.scale + ')' }
		},
	},
	mounted() {
		this.$nextTick(function() {
			fitTree()
			resizeCanvas()
		})
	},
	methods: {
		fitTree,
		zoomStep(f) {
			let r = this.$el.getBoundingClientRect()
			zoomTree(f, r.width / 2, r.height / 2)
		},
		onWheel(e) {
			let r = this.$el.getBoundingClientRect()
			zoomTree(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top)
		},
		onDown(e) {
			if (e.button === 1) e.preventDefault()
			else if (e.button !== 0) return
			if (e.target.closest && e.target.closest("button")) return
			this.startPan(e.clientX, e.clientY)
			this.dragging = true
		},
		startPan(cx, cy) {
			this.panStart = { x: cx, y: cy, vx: this.view.x, vy: this.view.y }
			let move = (ev) => {
				this.view.x = this.panStart.vx + (ev.clientX - this.panStart.x)
				this.view.y = this.panStart.vy + (ev.clientY - this.panStart.y)
			}
			let up = () => {
				this.dragging = false
				window.removeEventListener("mousemove", move)
				window.removeEventListener("mouseup", up)
			}
			window.addEventListener("mousemove", move)
			window.addEventListener("mouseup", up)
		},
		onTouchStart(e) {
			if (e.touches.length === 1 && !(e.target.closest && e.target.closest("button"))) {
				this.dragging = true
				this.panStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, vx: this.view.x, vy: this.view.y }
			} else if (e.touches.length === 2) {
				this.dragging = false
				this.panStart = null
				this.pinchStart = { dist: this.touchDist(e), scale: this.view.scale }
			}
		},
		onTouchMove(e) {
			if (e.touches.length === 1 && this.panStart) {
				this.view.x = this.panStart.vx + (e.touches[0].clientX - this.panStart.x)
				this.view.y = this.panStart.vy + (e.touches[0].clientY - this.panStart.y)
			} else if (e.touches.length === 2 && this.pinchStart) {
				let r = this.$el.getBoundingClientRect()
				let t = this.pinchStart
				let s = Math.min(treeView.maxScale, Math.max(treeView.minScale, t.scale * this.touchDist(e) / t.dist))
				let mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left
				let my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top
				let px = (mx - this.view.x) / this.view.scale
				let py = (my - this.view.y) / this.view.scale
				this.view.scale = s
				this.view.x = mx - px * s
				this.view.y = my - py * s
			}
		},
		onTouchEnd(e) {
			this.dragging = false
			this.panStart = null
			this.pinchStart = null
		},
		touchDist(e) {
			let dx = e.touches[0].clientX - e.touches[1].clientX
			let dy = e.touches[0].clientY - e.touches[1].clientY
			return Math.max(1, Math.sqrt(dx * dx + dy * dy))
		},
	},
})
