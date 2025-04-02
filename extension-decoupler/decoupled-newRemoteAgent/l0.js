
function L0(l) {
	let Z,
		b = l[0].raw + ""
	return {
		c() {
			Z = f(b)
		},
		m(m, G) {
			S(m, Z, G)
		},
		p(m, G) {
			1 & G && b !== (b = m[0].raw + "") && ul(Z, b)
		},
		i: A,
		o: A,
		d(m) {
			m && x(Z)
		},
	}
}