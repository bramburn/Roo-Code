
function DI(l) {
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
		R = l[21].title + ""
	V = new wi({ props: { markdown: l[21].description } })
	let Y =
			l[23] === 0 &&
			(function (y) {
				let a, n, N
				return (
					(n = new _l({
						props: {
							variant: "ghost",
							color: "neutral",
							size: 1,
							$$slots: { default: [oR] },
							$$scope: { ctx: y },
						},
					})),
					n.$on("click", y[8]),
					{
						c() {
							;(a = F("div")), K(n.$$.fragment), B(a, "class", "c-diff-view__controls svelte-ru5a2s")
						},
						m(C, T) {
							S(C, a, T), k(n, a, null), (N = !0)
						},
						p(C, T) {
							const L = {}
							1073741888 & T && (L.$$scope = { dirty: T, ctx: C }), n.$set(L)
						},
						i(C) {
							N || (J(n.$$.fragment, C), (N = !0))
						},
						o(C) {
							o(n.$$.fragment, C), (N = !1)
						},
						d(C) {
							C && x(a), z(n)
						},
					}
				)
			})(l),
		u = il(l[21].sections || []),
		p = []
	for (let y = 0; y < u.length; y += 1) p[y] = OI(wI(l, u, y))
	const h = (y) =>
		o(p[y], 1, 1, () => {
			p[y] = null
		})
	return {
		c() {
			;(Z = F("div")),
				(b = F("div")),
				(m = F("div")),
				(G = F("h5")),
				(c = f(R)),
				(d = E()),
				(W = F("div")),
				K(V.$$.fragment),
				(X = E()),
				Y && Y.c(),
				(I = E())
			for (let y = 0; y < p.length; y += 1) p[y].c()
			;(i = E()),
				B(G, "class", "c-diff-view__title svelte-ru5a2s"),
				B(W, "class", "c-diff-view__description svelte-ru5a2s"),
				B(m, "class", "c-diff-view__content svelte-ru5a2s"),
				B(b, "class", "c-diff-view__header svelte-ru5a2s"),
				B(Z, "class", "c-diff-view__section svelte-ru5a2s")
		},
		m(y, a) {
			S(y, Z, a),
				H(Z, b),
				H(b, m),
				H(m, G),
				H(G, c),
				H(m, d),
				H(m, W),
				k(V, W, null),
				H(b, X),
				Y && Y.m(b, null),
				H(Z, I)
			for (let n = 0; n < p.length; n += 1) p[n] && p[n].m(Z, null)
			H(Z, i), (g = !0)
		},
		p(y, a) {
			;(!g || 8 & a) && R !== (R = y[21].title + "") && ul(c, R)
			const n = {}
			if ((8 & a && (n.markdown = y[21].description), V.$set(n), y[23] === 0 && Y.p(y, a), 207 & a)) {
				let N
				for (u = il(y[21].sections || []), N = 0; N < u.length; N += 1) {
					const C = wI(y, u, N)
					p[N] ? (p[N].p(C, a), J(p[N], 1)) : ((p[N] = OI(C)), p[N].c(), J(p[N], 1), p[N].m(Z, i))
				}
				for (q(), N = u.length; N < p.length; N += 1) h(N)
				$()
			}
		},
		i(y) {
			if (!g) {
				J(V.$$.fragment, y), J(Y)
				for (let a = 0; a < u.length; a += 1) J(p[a])
				g = !0
			}
		},
		o(y) {
			o(V.$$.fragment, y), o(Y), (p = p.filter(Boolean))
			for (let a = 0; a < p.length; a += 1) o(p[a])
			g = !1
		},
		d(y) {
			y && x(Z), z(V), Y && Y.d(), Tl(p, y)
		},
	}
}