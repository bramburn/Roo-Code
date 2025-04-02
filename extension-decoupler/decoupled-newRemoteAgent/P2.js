
function P2(l) {
	let Z, b, m, G
	const c = [A2, D2],
		d = []
	function W(V, X) {
		return V[3].length > 0 ? 0 : 1
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
			p(V, [X]) {
				let I = Z
				;(Z = W(V)),
					Z === I
						? d[Z].p(V, X)
						: (q(),
							o(d[I], 1, 1, () => {
								d[I] = null
							}),
							$(),
							(b = d[Z]),
							b ? b.p(V, X) : ((b = d[Z] = c[Z](V)), b.c()),
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