
function M2(l) {
	let Z, b
	return (
		(Z = new Bl({ props: { size: 1, $$slots: { default: [e2] }, $$scope: { ctx: l } } })),
		{
			c() {
				K(Z.$$.fragment)
			},
			m(m, G) {
				k(Z, m, G), (b = !0)
			},
			p(m, G) {
				const c = {}
				4096 & G && (c.$$scope = { dirty: G, ctx: m }), Z.$set(c)
			},
			i(m) {
				b || (J(Z.$$.fragment, m), (b = !0))
			},
			o(m) {
				o(Z.$$.fragment, m), (b = !1)
			},
			d(m) {
				z(Z, m)
			},
		}
	)
}