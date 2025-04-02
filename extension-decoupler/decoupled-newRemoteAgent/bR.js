
function BR(l) {
	let Z,
		b,
		m,
		G,
		c,
		d,
		W,
		V,
		X,
		I,
		i = il(Array(Math.floor(3 * Math.random()) + 2)),
		g = []
	for (let R = 0; R < i.length; R += 1) g[R] = CR(sR(l, i, R))
	return {
		c() {
			;(Z = F("div")),
				(b = F("div")),
				(m = F("div")),
				(G = F("div")),
				(c = E()),
				(d = F("div")),
				(W = E()),
				(V = F("div")),
				(X = F("div"))
			for (let R = 0; R < g.length; R += 1) g[R].c()
			;(I = E()),
				B(G, "class", "c-diff-view__skeleton-title svelte-ru5a2s"),
				Fl(G, "width", 30 * Math.random() + 70 + "%"),
				B(d, "class", "c-diff-view__skeleton-description svelte-ru5a2s"),
				Fl(d, "width", 30 * Math.random() + 70 + "%"),
				B(m, "class", "c-diff-view__content svelte-ru5a2s"),
				B(b, "class", "c-diff-view__header svelte-ru5a2s"),
				B(X, "class", "c-diff-view__skeleton-code"),
				B(V, "class", "c-diff-view__changes svelte-ru5a2s"),
				B(Z, "class", "c-diff-view__subsection svelte-ru5a2s")
		},
		m(R, Y) {
			S(R, Z, Y), H(Z, b), H(b, m), H(m, G), H(m, c), H(m, d), H(Z, W), H(Z, V), H(V, X)
			for (let u = 0; u < g.length; u += 1) g[u] && g[u].m(X, null)
			H(Z, I)
		},
		p: A,
		d(R) {
			R && x(Z), Tl(g, R)
		},
	}
}