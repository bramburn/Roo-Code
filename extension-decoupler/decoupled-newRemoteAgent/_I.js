
function _I(l) {
	let Z, b, m, G, c, d
	Z = new KR({ props: { options: l[13].map(Zu), onSelectOption: l[18] } })
	const W = [PR, fR],
		V = []
	function X(I, i) {
		return I[4] === "changedFiles" ? 0 : 1
	}
	return (
		(G = X(l)),
		(c = V[G] = W[G](l)),
		{
			c() {
				K(Z.$$.fragment),
					(b = E()),
					(m = F("div")),
					c.c(),
					B(m, "class", "file-explorer-contents svelte-1bnkwkr")
			},
			m(I, i) {
				k(Z, I, i), S(I, b, i), S(I, m, i), V[G].m(m, null), (d = !0)
			},
			p(I, i) {
				const g = {}
				16 & i && (g.onSelectOption = I[18]), Z.$set(g)
				let R = G
				;(G = X(I)),
					G === R
						? V[G].p(I, i)
						: (q(),
							o(V[R], 1, 1, () => {
								V[R] = null
							}),
							$(),
							(c = V[G]),
							c ? c.p(I, i) : ((c = V[G] = W[G](I)), c.c()),
							J(c, 1),
							c.m(m, null))
			},
			i(I) {
				d || (J(Z.$$.fragment, I), J(c), (d = !0))
			},
			o(I) {
				o(Z.$$.fragment, I), o(c), (d = !1)
			},
			d(I) {
				I && (x(b), x(m)), z(Z, I), V[G].d()
			},
		}
	)
}