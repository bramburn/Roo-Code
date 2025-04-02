
function ER(l) {
	let Z, b
	return (
		(Z = new ii({
			props: {
				variant: "ghost",
				color: "error",
				size: 1,
				disabled: l[6],
				$$slots: { default: [vR] },
				$$scope: { ctx: l },
			},
		})),
		Z.$on("click", l[16]),
		{
			c() {
				K(Z.$$.fragment)
			},
			m(m, G) {
				k(Z, m, G), (b = !0)
			},
			p(m, G) {
				const c = {}
				64 & G && (c.disabled = m[6]), 4194368 & G && (c.$$scope = { dirty: G, ctx: m }), Z.$set(c)
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