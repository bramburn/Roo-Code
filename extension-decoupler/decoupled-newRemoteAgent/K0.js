
function k0(l) {
	let Z,
		b = l[3],
		m = l[3] && MZ(l)
	return {
		c() {
			m && m.c(), (Z = Cl())
		},
		m(G, c) {
			m && m.m(G, c), S(G, Z, c)
		},
		p(G, [c]) {
			G[3]
				? b
					? j(b, G[3])
						? (m.d(1), (m = MZ(G)), (b = G[3]), m.c(), m.m(Z.parentNode, Z))
						: m.p(G, c)
					: ((m = MZ(G)), (b = G[3]), m.c(), m.m(Z.parentNode, Z))
				: b && (m.d(1), (m = null), (b = G[3]))
		},
		i: A,
		o(G) {
			o(m, G)
		},
		d(G) {
			G && x(Z), m && m.d(G)
		},
	}
}