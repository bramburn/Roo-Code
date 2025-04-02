
function x2(l, Z) {
	const b = (function (W, V, X, I, i, g, R) {
			var Y
			if ((typeof R == "function" && (R = { callback: R }), (Y = R) === null || Y === void 0 || !Y.callback)) {
				var u = wb(W, V, X, I, i, g, R)
				return u ? db(u) : void 0
			}
			var p = R.callback
			wb(
				W,
				V,
				X,
				I,
				i,
				g,
				oZ(
					oZ({}, R),
					{},
					{
						callback: function (h) {
							h ? p(db(h)) : p()
						},
					},
				),
			)
		})("oldFile", "newFile", l, Z, "", "", { context: 3 }),
		m = (function (W) {
			var V = W.split(/\n/),
				X = [],
				I = 0
			function i() {
				var Y = {}
				for (X.push(Y); I < V.length; ) {
					var u = V[I]
					if (/^(\-\-\-|\+\+\+|@@)\s/.test(u)) break
					var p = /^(?:Index:|diff(?: -r \w+)+)\s+(.+?)\s*$/.exec(u)
					p && (Y.index = p[1]), I++
				}
				for (g(Y), g(Y), Y.hunks = []; I < V.length; ) {
					var h = V[I]
					if (
						/^(Index:\s|diff\s|\-\-\-\s|\+\+\+\s|===================================================================)/.test(
							h,
						)
					)
						break
					if (/^@@/.test(h)) Y.hunks.push(R())
					else {
						if (h) throw new Error("Unknown line " + (I + 1) + " " + JSON.stringify(h))
						I++
					}
				}
			}
			function g(Y) {
				var u = /^(---|\+\+\+)\s+(.*)\r?$/.exec(V[I])
				if (u) {
					var p = u[1] === "---" ? "old" : "new",
						h = u[2].split("	", 2),
						y = h[0].replace(/\\\\/g, "\\")
					;/^".*"$/.test(y) && (y = y.substr(1, y.length - 2)),
						(Y[p + "FileName"] = y),
						(Y[p + "Header"] = (h[1] || "").trim()),
						I++
				}
			}
			function R() {
				var Y = I,
					u = V[I++].split(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/),
					p = {
						oldStart: +u[1],
						oldLines: u[2] === void 0 ? 1 : +u[2],
						newStart: +u[3],
						newLines: u[4] === void 0 ? 1 : +u[4],
						lines: [],
					}
				p.oldLines === 0 && (p.oldStart += 1), p.newLines === 0 && (p.newStart += 1)
				for (
					var h = 0, y = 0;
					I < V.length &&
					(y < p.oldLines || h < p.newLines || ((a = V[I]) !== null && a !== void 0 && a.startsWith("\\")));
					I++
				) {
					var a,
						n = V[I].length == 0 && I != V.length - 1 ? " " : V[I][0]
					if (n !== "+" && n !== "-" && n !== " " && n !== "\\")
						throw new Error("Hunk at line ".concat(Y + 1, " contained invalid line ").concat(V[I]))
					p.lines.push(V[I]), n === "+" ? h++ : n === "-" ? y++ : n === " " && (h++, y++)
				}
				if (
					(h || p.newLines !== 1 || (p.newLines = 0),
					y || p.oldLines !== 1 || (p.oldLines = 0),
					h !== p.newLines)
				)
					throw new Error("Added line count did not match for hunk at line " + (Y + 1))
				if (y !== p.oldLines) throw new Error("Removed line count did not match for hunk at line " + (Y + 1))
				return p
			}
			for (; I < V.length; ) i()
			return X
		})(b)
	let G = 0,
		c = 0,
		d = []
	for (const W of m)
		for (const V of W.hunks)
			for (const X of V.lines) {
				const I = X.startsWith("+"),
					i = X.startsWith("-")
				I && G++, i && c++, d.push({ value: X, added: I, removed: i })
			}
	return { totalAddedLines: G, totalRemovedLines: c, changes: d, diff: b }
}