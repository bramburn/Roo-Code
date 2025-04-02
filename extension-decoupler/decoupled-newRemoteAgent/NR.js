
function nR(l) {
	let Z,
		b,
		m = il(l[3]),
		G = []
	for (let d = 0; d < m.length; d += 1) G[d] = DI(MI(l, m, d))
	const c = (d) =>
		o(G[d], 1, 1, () => {
			G[d] = null
		})
	return {
		c() {
			Z = F("div")
			for (let d = 0; d < G.length; d += 1) G[d].c()
			B(Z, "class", "c-diff-view__explanation")
		},
		m(d, W) {
			S(d, Z, W)
			for (let V = 0; V < G.length; V += 1) G[V] && G[V].m(Z, null)
			b = !0
		},
		p(d, W) {
			if (463 & W) {
				let V
				for (m = il(d[3]), V = 0; V < m.length; V += 1) {
					const X = MI(d, m, V)
					G[V] ? (G[V].p(X, W), J(G[V], 1)) : ((G[V] = DI(X)), G[V].c(), J(G[V], 1), G[V].m(Z, null))
				}
				for (q(), V = m.length; V < G.length; V += 1) c(V)
				$()
			}
		},
		i(d) {
			if (!b) {
				for (let W = 0; W < m.length; W += 1) J(G[W])
				b = !0
			}
		},
		o(d) {
			G = G.filter(Boolean)
			for (let W = 0; W < G.length; W += 1) o(G[W])
			b = !1
		},
		d(d) {
			d && x(Z), Tl(G, d)
		},
	}
}