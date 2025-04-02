
function U2(l) {
	let Z, b, m
	return (
		(b = new T2({
			props: { path: l[0], originalCode: l[1].originalCode, modifiedCode: l[1].modifiedCode, theme: l[6] },
		})),
		{
			c() {
				;(Z = F("div")), K(b.$$.fragment), B(Z, "class", "changes svelte-it54y8")
			},
			m(G, c) {
				S(G, Z, c), k(b, Z, null), (m = !0)
			},
			p(G, c) {
				const d = {}
				1 & c && (d.path = G[0]),
					2 & c && (d.originalCode = G[1].originalCode),
					2 & c && (d.modifiedCode = G[1].modifiedCode),
					64 & c && (d.theme = G[6]),
					b.$set(d)
			},
			i(G) {
				m || (J(b.$$.fragment, G), (m = !0))
			},
			o(G) {
				o(b.$$.fragment, G), (m = !1)
			},
			d(G) {
				G && x(Z), z(b)
			},
		}
	)
}