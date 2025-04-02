
function HY(l) {
	let Z
	const b = l[4].default,
		m = pl(b, l, l[3], null)
	return {
		c() {
			m && m.c()
		},
		m(G, c) {
			m && m.m(G, c), (Z = !0)
		},
		p(G, [c]) {
			m && m.p && (!Z || 8 & c) && yl(m, b, G, G[3], Z ? sl(b, G[3], c, null) : hl(G[3]), null)
		},
		i(G) {
			Z || (J(m, G), (Z = !0))
		},
		o(G) {
			o(m, G), (Z = !1)
		},
		d(G) {
			m && m.d(G)
		},
	}
}