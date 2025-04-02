
function A2(l) {
	let Z,
		b,
		m,
		G = [],
		c = new Map(),
		d = il(l[3])
	const W = (V) => V[6].qualifiedPathName.relPath
	for (let V = 0; V < d.length; V += 1) {
		let X = Qb(l, d, V),
			I = W(X)
		c.set(I, (G[V] = jb(I, X)))
	}
	return {
		c() {
			;(Z = F("div")), (b = F("div"))
			for (let V = 0; V < G.length; V += 1) G[V].c()
			B(b, "class", "c-edits-section"), B(Z, "class", "c-edits-list svelte-1bneybo")
		},
		m(V, X) {
			S(V, Z, X), H(Z, b)
			for (let I = 0; I < G.length; I += 1) G[I] && G[I].m(b, null)
			m = !0
		},
		p(V, X) {
			15 & X && ((d = il(V[3])), q(), (G = m2(G, X, W, 1, V, d, c, b, G2, jb, null, Qb)), $())
		},
		i(V) {
			if (!m) {
				for (let X = 0; X < d.length; X += 1) J(G[X])
				m = !0
			}
		},
		o(V) {
			for (let X = 0; X < G.length; X += 1) o(G[X])
			m = !1
		},
		d(V) {
			V && x(Z)
			for (let X = 0; X < G.length; X += 1) G[X].d()
		},
	}
}