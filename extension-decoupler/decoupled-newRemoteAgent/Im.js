
function im(l) {
	let Z, b, m
	return (
		(b = new HZ({ props: { tokens: l[6].tokens, options: l[1], renderers: l[2] } })),
		{
			c() {
				;(Z = F("td")), K(b.$$.fragment)
			},
			m(G, c) {
				S(G, Z, c), k(b, Z, null), (m = !0)
			},
			p(G, c) {
				const d = {}
				1 & c && (d.tokens = G[6].tokens), 2 & c && (d.options = G[1]), 4 & c && (d.renderers = G[2]), b.$set(d)
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