
function M0(l) {
	let Z, b
	const m = l[4].default,
		G = pl(m, l, l[3], null)
	return {
		c() {
			;(Z = F("li")), G && G.c()
		},
		m(c, d) {
			S(c, Z, d), G && G.m(Z, null), (b = !0)
		},
		p(c, [d]) {
			G && G.p && (!b || 8 & d) && yl(G, m, c, c[3], b ? sl(m, c[3], d, null) : hl(c[3]), null)
		},
		i(c) {
			b || (J(G, c), (b = !0))
		},
		o(c) {
			o(G, c), (b = !1)
		},
		d(c) {
			c && x(Z), G && G.d(c)
		},
	}
}