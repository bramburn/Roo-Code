
function D2(l) {
	let Z, b, m
	return (
		(b = new Bl({ props: { size: 1, color: "neutral", $$slots: { default: [f2] }, $$scope: { ctx: l } } })),
		{
			c() {
				;(Z = F("div")), K(b.$$.fragment), B(Z, "class", "c-edits-list c-edits-list--empty svelte-1bneybo")
			},
			m(G, c) {
				S(G, Z, c), k(b, Z, null), (m = !0)
			},
			p(G, c) {
				const d = {}
				512 & c && (d.$$scope = { dirty: c, ctx: G }), b.$set(d)
			},
			i(G) {
				m || (J(b.$$.fragment, G), (m = !0))
			},
			o(G) {
				o(b.$$.fragment, G), (m = !1)
			},
			d(G) {
				G && x(Z), z(b)
			},
		}
	)
}