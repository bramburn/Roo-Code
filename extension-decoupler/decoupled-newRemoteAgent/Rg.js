
function rg(l) {
	let Z,
		b,
		m = l[3] && LI(l)
	return {
		c() {
			m && m.c(), (Z = Cl())
		},
		m(G, c) {
			m && m.m(G, c), S(G, Z, c), (b = !0)
		},
		p(G, [c]) {
			G[3]
				? m
					? (m.p(G, c), 8 & c && J(m, 1))
					: ((m = LI(G)), m.c(), J(m, 1), m.m(Z.parentNode, Z))
				: m &&
					(q(),
					o(m, 1, 1, () => {
						m = null
					}),
					$())
		},
		i(G) {
			b || (J(m), (b = !0))
		},
		o(G) {
			o(m), (b = !1)
		},
		d(G) {
			G && x(Z), m && m.d(G)
		},
	}
}