
function E2(l) {
	let Z, b, m, G, c, d, W, V, X, I, i, g
	b = new di({})
	let R = l[8] > 0 && vb(l),
		Y = l[7] > 0 && Eb(l)
	const u = [z2, k2],
		p = []
	function h(y, a) {
		return y[4] ? 0 : 1
	}
	return (
		(I = h(l)),
		(i = p[I] = u[I](l)),
		{
			c() {
				;(Z = F("div")),
					K(b.$$.fragment),
					(m = E()),
					(G = F("div")),
					(c = f(l[0])),
					(d = E()),
					(W = F("div")),
					R && R.c(),
					(V = E()),
					Y && Y.c(),
					(X = E()),
					i.c(),
					B(G, "class", "path svelte-it54y8"),
					B(W, "class", "changes-indicator svelte-it54y8"),
					B(Z, "slot", "header"),
					B(Z, "class", "header svelte-it54y8")
			},
			m(y, a) {
				S(y, Z, a),
					k(b, Z, null),
					H(Z, m),
					H(Z, G),
					H(G, c),
					H(Z, d),
					H(Z, W),
					R && R.m(W, null),
					H(W, V),
					Y && Y.m(W, null),
					H(Z, X),
					p[I].m(Z, null),
					(g = !0)
			},
			p(y, a) {
				;(!g || 1 & a) && ul(c, y[0]),
					y[8] > 0
						? R
							? (R.p(y, a), 256 & a && J(R, 1))
							: ((R = vb(y)), R.c(), J(R, 1), R.m(W, V))
						: R &&
							(q(),
							o(R, 1, 1, () => {
								R = null
							}),
							$()),
					y[7] > 0
						? Y
							? (Y.p(y, a), 128 & a && J(Y, 1))
							: ((Y = Eb(y)), Y.c(), J(Y, 1), Y.m(W, null))
						: Y &&
							(q(),
							o(Y, 1, 1, () => {
								Y = null
							}),
							$())
				let n = I
				;(I = h(y)),
					I === n
						? p[I].p(y, a)
						: (q(),
							o(p[n], 1, 1, () => {
								p[n] = null
							}),
							$(),
							(i = p[I]),
							i ? i.p(y, a) : ((i = p[I] = u[I](y)), i.c()),
							J(i, 1),
							i.m(Z, null))
			},
			i(y) {
				g || (J(b.$$.fragment, y), J(R), J(Y), J(i), (g = !0))
			},
			o(y) {
				o(b.$$.fragment, y), o(R), o(Y), o(i), (g = !1)
			},
			d(y) {
				y && x(Z), z(b), R && R.d(), Y && Y.d(), p[I].d()
			},
		}
	)
}