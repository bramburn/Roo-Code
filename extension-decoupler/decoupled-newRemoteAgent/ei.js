
function EI(l) {
	let Z, b, m, G, c, d, W
	return (
		(b = new Yi({})),
		(d = new _l({ props: { variant: "ghost", size: 1, $$slots: { default: [NR] }, $$scope: { ctx: l } } })),
		d.$on("click", l[9]),
		{
			c() {
				;(Z = F("div")),
					K(b.$$.fragment),
					(m = E()),
					(G = f(l[5])),
					(c = E()),
					K(d.$$.fragment),
					B(Z, "class", "c-diff-view__error svelte-ru5a2s")
			},
			m(V, X) {
				S(V, Z, X), k(b, Z, null), H(Z, m), H(Z, G), H(Z, c), k(d, Z, null), (W = !0)
			},
			p(V, X) {
				;(!W || 32 & X) && ul(G, V[5])
				const I = {}
				1073741824 & X && (I.$$scope = { dirty: X, ctx: V }), d.$set(I)
			},
			i(V) {
				W || (J(b.$$.fragment, V), J(d.$$.fragment, V), (W = !0))
			},
			o(V) {
				o(b.$$.fragment, V), o(d.$$.fragment, V), (W = !1)
			},
			d(V) {
				V && x(Z), z(b), z(d)
			},
		}
	)
}