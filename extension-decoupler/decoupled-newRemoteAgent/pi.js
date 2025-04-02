
function PI(l) {
	let Z, b
	return (
		(Z = new X2({
			props: {
				size: l[1],
				disabled: l[2],
				variant: "ghost",
				color: "neutral",
				class: "c-toggle-button__button",
				$$slots: { default: [TR] },
				$$scope: { ctx: l },
			},
		})),
		Z.$on("click", function () {
			return l[13](l[17])
		}),
		{
			c() {
				K(Z.$$.fragment)
			},
			m(m, G) {
				k(Z, m, G), (b = !0)
			},
			p(m, G) {
				l = m
				const c = {}
				2 & G && (c.size = l[1]),
					4 & G && (c.disabled = l[2]),
					32771 & G && (c.$$scope = { dirty: G, ctx: l }),
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