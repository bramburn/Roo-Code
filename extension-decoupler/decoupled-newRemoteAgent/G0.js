
function g0(l) {
	let Z, b
	return (
		(Z = new gb({
			props: {
				content: l[3] ? "Applying changes..." : "Apply changes to file",
				$$slots: { default: [p0] },
				$$scope: { ctx: l },
			},
		})),
		{
			c() {
				K(Z.$$.fragment)
			},
			m(m, G) {
				k(Z, m, G), (b = !0)
			},
			p(m, G) {
				const c = {}
				8 & G && (c.content = m[3] ? "Applying changes..." : "Apply changes to file"),
					4128 & G && (c.$$scope = { dirty: G, ctx: m }),
					Z.$set(c)
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