
function SR(l, Z, b) {
	let m,
		{ changedFiles: G } = Z,
		{ onApplyChanges: c } = Z,
		{ pendingFiles: d = [] } = Z,
		{ appliedFiles: W = [] } = Z,
		V = "",
		X = !1
	jl(() => {
		const p = localStorage.getItem("anthropic_apikey")
		p && b(11, (V = p)), b(12, (X = !0))
	})
	let I = [],
		i = !1,
		g = null,
		R = !1,
		Y = []
	async function u() {
		if (X)
			if ((b(4, (i = !0)), G.length))
				try {
					b(5, (g = null))
					const p = new i2((y) => Y2.postMessage(y)),
						h = await p.send({ type: g2.diffExplanationRequest, data: { changedFiles: G, apikey: V } }, 1e5)
					b(3, (I = h.data.explanation)),
						b(4, (i = !1)),
						I.length === 0 && b(5, (g = "Failed to generate explanation."))
				} catch (p) {
					console.error("Failed to get explanation:", p), b(3, (I = [])), b(4, (i = !1))
				}
			else b(5, (g = "No changes to explain"))
	}
	return (
		(l.$$set = (p) => {
			"changedFiles" in p && b(10, (G = p.changedFiles)),
				"onApplyChanges" in p && b(0, (c = p.onApplyChanges)),
				"pendingFiles" in p && b(1, (d = p.pendingFiles)),
				"appliedFiles" in p && b(2, (W = p.appliedFiles))
		}),
		(l.$$.update = () => {
			1024 & l.$$.dirty && b(13, (m = JSON.stringify(G))), 14336 & l.$$.dirty && u()
		}),
		[
			c,
			d,
			W,
			I,
			i,
			g,
			R,
			Y,
			function () {
				b(6, (R = !R)),
					Y.forEach((p) => {
						p && p.$set({ isExpanded: R })
					})
			},
			u,
			G,
			V,
			X,
			m,
			(p) => {
				c == null || c(p.path, p.originalCode, p.modifiedCode)
			},
			function (p) {
				Sl[p ? "unshift" : "push"](() => {
					;(Y[Y.length] = p), b(7, Y)
				})
			},
		]
	)
}