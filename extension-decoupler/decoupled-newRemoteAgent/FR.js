
function fR(l) {
	var m, G
	let Z, b
	return (
		(Z = new xR({
			props: {
				changedFiles: l[8],
				onApplyChanges: l[14],
				pendingFiles: (m = l[2]) == null ? void 0 : m.applyingFilePaths,
				appliedFiles: (G = l[2]) == null ? void 0 : G.appliedFilePaths,
			},
		})),
		{
			c() {
				K(Z.$$.fragment)
			},
			m(c, d) {
				k(Z, c, d), (b = !0)
			},
			p(c, d) {
				var V, X
				const W = {}
				256 & d && (W.changedFiles = c[8]),
					4 & d && (W.pendingFiles = (V = c[2]) == null ? void 0 : V.applyingFilePaths),
					4 & d && (W.appliedFiles = (X = c[2]) == null ? void 0 : X.appliedFilePaths),
					Z.$set(W)
			},
			i(c) {
				b || (J(Z.$$.fragment, c), (b = !0))
			},
			o(c) {
				o(Z.$$.fragment, c), (b = !1)
			},
			d(c) {
				z(Z, c)
			},
		}
	)
}