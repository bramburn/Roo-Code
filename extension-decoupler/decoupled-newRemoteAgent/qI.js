
function QI(l) {
	let Z,
		b,
		m,
		G,
		c,
		d = l[24].warning + ""
	return (
		(b = new Yi({})),
		{
			c() {
				;(Z = F("div")),
					K(b.$$.fragment),
					(m = E()),
					(G = f(d)),
					B(Z, "class", "c-diff-view__warning svelte-ru5a2s")
			},
			m(W, V) {
				S(W, Z, V), k(b, Z, null), H(Z, m), H(Z, G), (c = !0)
			},
			p(W, V) {
				;(!c || 8 & V) && d !== (d = W[24].warning + "") && ul(G, d)
			},
			i(W) {
				c || (J(b.$$.fragment, W), (c = !0))
			},
			o(W) {
				o(b.$$.fragment, W), (c = !1)
			},
			d(W) {
				W && x(Z), z(b)
			},
		}
	)
}