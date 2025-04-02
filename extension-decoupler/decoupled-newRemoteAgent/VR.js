
function vR(l) {
	let Z, b, m, G
	const c = [wR, MR],
		d = []
	function W(V, X) {
		return V[6] ? 0 : 1
	}
	return (
		(Z = W(l)),
		(b = d[Z] = c[Z](l)),
		{
			c() {
				b.c(), (m = Cl())
			},
			m(V, X) {
				d[Z].m(V, X), S(V, m, X), (G = !0)
			},
			p(V, X) {
				let I = Z
				;(Z = W(V)),
					Z !== I &&
						(q(),
						o(d[I], 1, 1, () => {
							d[I] = null
						}),
						$(),
						(b = d[Z]),
						b || ((b = d[Z] = c[Z](V)), b.c()),
						J(b, 1),
						b.m(m.parentNode, m))
			},
			i(V) {
				G || (J(b), (G = !0))
			},
			o(V) {
				o(b), (G = !1)
			},
			d(V) {
				V && x(m), d[Z].d(V)
			},
		}
	)
}