
function O0(l) {
	let Z,
		b,
		m,
		G,
		c = l[0].text + ""
	return {
		c() {
			;(Z = F("pre")), (b = F("code")), (m = f(c)), B(b, "class", (G = `lang-${l[0].lang}`))
		},
		m(d, W) {
			S(d, Z, W), H(Z, b), H(b, m)
		},
		p(d, [W]) {
			1 & W && c !== (c = d[0].text + "") && ul(m, c),
				1 & W && G !== (G = `lang-${d[0].lang}`) && B(b, "class", G)
		},
		i: A,
		o: A,
		d(d) {
			d && x(Z)
		},
	}
}