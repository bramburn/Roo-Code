
function rR(l) {
	let Z, b, m, G, c, d, W, V
	G = new Bl({ props: { size: 1, weight: "medium", $$slots: { default: [DR] }, $$scope: { ctx: l } } })
	let X = l[1] !== -1 && rI(l),
		I = l[8] && _I(l)
	return {
		c() {
			;(Z = F("div")),
				(b = F("div")),
				(m = F("div")),
				K(G.$$.fragment),
				(c = E()),
				X && X.c(),
				(d = E()),
				(W = F("div")),
				I && I.c(),
				B(m, "class", "file-explorer-header--text svelte-1bnkwkr"),
				B(b, "class", "file-explorer-header svelte-1bnkwkr"),
				B(W, "class", "file-explorer-main svelte-1bnkwkr"),
				B(Z, "slot", "right"),
				B(Z, "class", "file-explorer-section svelte-1bnkwkr")
		},
		m(i, g) {
			S(i, Z, g),
				H(Z, b),
				H(b, m),
				k(G, m, null),
				H(b, c),
				X && X.m(b, null),
				H(Z, d),
				H(Z, W),
				I && I.m(W, null),
				(V = !0)
		},
		p(i, g) {
			const R = {}
			4194306 & g && (R.$$scope = { dirty: g, ctx: i }),
				G.$set(R),
				i[1] !== -1
					? X
						? (X.p(i, g), 2 & g && J(X, 1))
						: ((X = rI(i)), X.c(), J(X, 1), X.m(b, null))
					: X &&
						(q(),
						o(X, 1, 1, () => {
							X = null
						}),
						$()),
				i[8]
					? I
						? (I.p(i, g), 256 & g && J(I, 1))
						: ((I = _I(i)), I.c(), J(I, 1), I.m(W, null))
					: I &&
						(q(),
						o(I, 1, 1, () => {
							I = null
						}),
						$())
		},
		i(i) {
			V || (J(G.$$.fragment, i), J(X), J(I), (V = !0))
		},
		o(i) {
			o(G.$$.fragment, i), o(X), o(I), (V = !1)
		},
		d(i) {
			i && x(Z), z(G), X && X.d(), I && I.d()
		},
	}
}