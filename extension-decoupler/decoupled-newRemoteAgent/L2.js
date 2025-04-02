
function L2(l, Z, b) {
	let m,
		G,
		c,
		d,
		W,
		V,
		{ originalCode: X = "" } = Z,
		{ modifiedCode: I = "" } = Z,
		{ path: i } = Z,
		{ lineOffset: g = 0 } = Z,
		{ extraPrefixLines: R = [] } = Z,
		{ extraSuffixLines: Y = [] } = Z,
		{ theme: u } = Z
	function p(h, y, a, n = [], N = []) {
		d == null || d.dispose(), W == null || W.dispose(), (y = y || ""), (a = a || "")
		const C = n.join(""),
			T = N.join("")
		;(y = C + y + T),
			(a = C + a + T),
			(d = el.createModel(
				y,
				void 0,
				h !== void 0 ? NZ.parse("file://" + h + `#${crypto.randomUUID()}`) : void 0,
			)),
			(W = el.createModel(
				a,
				void 0,
				h !== void 0 ? NZ.parse("file://" + h + `#${crypto.randomUUID()}`) : void 0,
			)),
			c && c.setModel({ original: d, modified: W })
	}
	return (
		WZ(() => {
			c == null || c.dispose(), d == null || d.dispose(), W == null || W.dispose()
		}),
		jl(() => {
			;(c = el.createDiffEditor(V, {
				automaticLayout: !0,
				theme: u,
				renderSideBySide: !1,
				renderIndicators: !0,
				renderMarginRevertIcon: !1,
				originalEditable: !1,
				diffCodeLens: !1,
				renderOverviewRuler: !1,
				renderFinalNewline: "off",
				ignoreTrimWhitespace: !1,
				scrollBeyondLastLine: !1,
				lineNumbers: (h) => `${g - R.length + h}`,
				hideUnchangedRegions: { enabled: !0, revealLineCount: 3, minimumLineCount: 3, contextLineCount: 3 },
			})),
				p(i, X, I, R, Y)
		}),
		(l.$$set = (h) => {
			"originalCode" in h && b(2, (X = h.originalCode)),
				"modifiedCode" in h && b(3, (I = h.modifiedCode)),
				"path" in h && b(4, (i = h.path)),
				"lineOffset" in h && b(5, (g = h.lineOffset)),
				"extraPrefixLines" in h && b(6, (R = h.extraPrefixLines)),
				"extraSuffixLines" in h && b(7, (Y = h.extraSuffixLines)),
				"theme" in h && b(8, (u = h.theme))
		}),
		(l.$$.update = () => {
			12 & l.$$.dirty &&
				b(
					10,
					(m = (X + I).split(`
`).length),
				),
				1024 & l.$$.dirty && b(1, (G = 1.5 * Math.min(m, 13))),
				220 & l.$$.dirty && p(i, X, I, R, Y)
		}),
		[
			V,
			G,
			X,
			I,
			i,
			g,
			R,
			Y,
			u,
			function () {
				var h
				return {
					lineChanges:
						((h = c == null ? void 0 : c.getLineChanges()) == null
							? void 0
							: h.map((y) => ({
									originalStart: y.originalStartLineNumber,
									originalEnd: y.originalEndLineNumber,
									modifiedStart: y.modifiedStartLineNumber,
									modifiedEnd: y.modifiedEndLineNumber,
								}))) || [],
					lineOffset: g - R.length,
				}
			},
			m,
			function (h) {
				Sl[h ? "unshift" : "push"](() => {
					;(V = h), b(0, V)
				})
			},
		]
	)
}