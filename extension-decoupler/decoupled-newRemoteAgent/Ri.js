
function rI(l) {
	let Z, b
	return (
		(Z = new _l({
			props: { variant: "ghost", color: "neutral", size: 1, $$slots: { default: [AR] }, $$scope: { ctx: l } },
		})),
		Z.$on("click", l[17]),
		{
			c() {
				K(Z.$$.fragment)
			},
			m(m, G) {
				k(Z, m, G), (b = !0)
			},
			p(m, G) {
				const c = {}
				4194304 & G && (c.$$scope = { dirty: G, ctx: m }), Z.$set(c)
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