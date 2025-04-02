
function OI(l) {
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
		i,
		g,
		R,
		Y,
		u,
		p = l[24].title + ""
	G = new d0({ props: { type: l[24].type } })
	let h = l[24].warning && QI(l)
	g = new wi({ props: { markdown: l[24].description } })
	let y = il(l[24].changes),
		a = []
	for (let N = 0; N < y.length; N += 1) a[N] = jI(vI(l, y, N))
	const n = (N) =>
		o(a[N], 1, 1, () => {
			a[N] = null
		})
	return {
		c() {
			;(Z = F("div")),
				(b = F("div")),
				(m = F("div")),
				K(G.$$.fragment),
				(c = E()),
				(d = F("div")),
				(W = F("h5")),
				(V = f(p)),
				(X = E()),
				h && h.c(),
				(I = E()),
				(i = F("div")),
				K(g.$$.fragment),
				(R = E()),
				(Y = F("div"))
			for (let N = 0; N < a.length; N += 1) a[N].c()
			B(m, "class", "c-diff-view__icon svelte-ru5a2s"),
				B(W, "class", "c-diff-view__title svelte-ru5a2s"),
				B(i, "class", "c-diff-view__description svelte-ru5a2s"),
				B(d, "class", "c-diff-view__content svelte-ru5a2s"),
				B(b, "class", "c-diff-view__header svelte-ru5a2s"),
				B(Y, "class", "c-diff-view__changes svelte-ru5a2s"),
				B(Z, "class", "c-diff-view__subsection svelte-ru5a2s")
		},
		m(N, C) {
			S(N, Z, C),
				H(Z, b),
				H(b, m),
				k(G, m, null),
				H(b, c),
				H(b, d),
				H(d, W),
				H(W, V),
				H(d, X),
				h && h.m(d, null),
				H(d, I),
				H(d, i),
				k(g, i, null),
				H(Z, R),
				H(Z, Y)
			for (let T = 0; T < a.length; T += 1) a[T] && a[T].m(Y, null)
			u = !0
		},
		p(N, C) {
			const T = {}
			8 & C && (T.type = N[24].type),
				G.$set(T),
				(!u || 8 & C) && p !== (p = N[24].title + "") && ul(V, p),
				N[24].warning
					? h
						? (h.p(N, C), 8 & C && J(h, 1))
						: ((h = QI(N)), h.c(), J(h, 1), h.m(d, I))
					: h &&
						(q(),
						o(h, 1, 1, () => {
							h = null
						}),
						$())
			const L = {}
			if ((8 & C && (L.markdown = N[24].description), g.$set(L), 207 & C)) {
				let U
				for (y = il(N[24].changes), U = 0; U < y.length; U += 1) {
					const M = vI(N, y, U)
					a[U] ? (a[U].p(M, C), J(a[U], 1)) : ((a[U] = jI(M)), a[U].c(), J(a[U], 1), a[U].m(Y, null))
				}
				for (q(), U = y.length; U < a.length; U += 1) n(U)
				$()
			}
		},
		i(N) {
			if (!u) {
				J(G.$$.fragment, N), J(h), J(g.$$.fragment, N)
				for (let C = 0; C < y.length; C += 1) J(a[C])
				u = !0
			}
		},
		o(N) {
			o(G.$$.fragment, N), o(h), o(g.$$.fragment, N), (a = a.filter(Boolean))
			for (let C = 0; C < a.length; C += 1) o(a[C])
			u = !1
		},
		d(N) {
			N && x(Z), z(G), h && h.d(), z(g), Tl(a, N)
		},
	}
}