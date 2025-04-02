
function zR(l) {
	let Z, b, m, G, c, d, W, V, X
	return (
		(m = new _l({ props: { variant: "ghost", size: 1, $$slots: { default: [_R] }, $$scope: { ctx: l } } })),
		m.$on("click", function () {
			Zi(l[10]) && l[10].apply(this, arguments)
		}),
		(d = new Yb({ props: { size: 3 } })),
		(V = new Bl({ props: { size: 2, $$slots: { default: [qR] }, $$scope: { ctx: l } } })),
		{
			c() {
				;(Z = F("div")),
					(b = F("header")),
					K(m.$$.fragment),
					(G = E()),
					(c = F("div")),
					K(d.$$.fragment),
					(W = E()),
					K(V.$$.fragment),
					B(b, "class", "svelte-1bnkwkr"),
					B(c, "class", "loading-container svelte-1bnkwkr"),
					B(Z, "class", "agent-detail svelte-1bnkwkr")
			},
			m(I, i) {
				S(I, Z, i), H(Z, b), k(m, b, null), H(Z, G), H(Z, c), k(d, c, null), H(c, W), k(V, c, null), (X = !0)
			},
			p(I, i) {
				l = I
				const g = {}
				4194304 & i && (g.$$scope = { dirty: i, ctx: l }), m.$set(g)
				const R = {}
				4194304 & i && (R.$$scope = { dirty: i, ctx: l }), V.$set(R)
			},
			i(I) {
				X || (J(m.$$.fragment, I), J(d.$$.fragment, I), J(V.$$.fragment, I), (X = !0))
			},
			o(I) {
				o(m.$$.fragment, I), o(d.$$.fragment, I), o(V.$$.fragment, I), (X = !1)
			},
			d(I) {
				I && x(Z), z(m), z(d), z(V)
			},
		}
	)
}