
function AR(l) {
	let Z
	return {
		c() {
			Z = f("Show aggregate changes")
		},
		m(b, m) {
			S(b, Z, m)
		},
		d(b) {
			b && x(Z)
		},
	}
}