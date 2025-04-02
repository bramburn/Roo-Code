
function j2(l, Z, b) {
	let m, G, c, d, W
	Pl(l, $I, (Y) => b(10, (W = Y)))
	let { path: V } = Z,
		{ change: X } = Z,
		{ isExpanded: I } = Z,
		{ isApplying: i } = Z,
		{ hasApplied: g } = Z,
		{ onApplyChanges: R } = Z
	return (
		(l.$$set = (Y) => {
			"path" in Y && b(0, (V = Y.path)),
				"change" in Y && b(1, (X = Y.change)),
				"isExpanded" in Y && b(2, (I = Y.isExpanded)),
				"isApplying" in Y && b(3, (i = Y.isApplying)),
				"hasApplied" in Y && b(4, (g = Y.hasApplied)),
				"onApplyChanges" in Y && b(5, (R = Y.onApplyChanges))
		}),
		(l.$$.update = () => {
			2 & l.$$.dirty &&
				b(
					9,
					(m = X.diff.split(`
`)),
				),
				512 & l.$$.dirty && b(8, (G = m.filter((Y) => Y.startsWith("+")).length)),
				512 & l.$$.dirty && b(7, (c = m.filter((Y) => Y.startsWith("-")).length)),
				1024 & l.$$.dirty && b(6, (d = Xi(W == null ? void 0 : W.category, W == null ? void 0 : W.intensity)))
		}),
		[
			V,
			X,
			I,
			i,
			g,
			R,
			d,
			c,
			G,
			m,
			W,
			() => {
				R == null || R()
			},
		]
	)
}