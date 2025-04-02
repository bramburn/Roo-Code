
function LI(l) {
	let Z, b, m
	function G(d) {
		l[8](d)
	}
	let c = { options: l[1], model: l[3], height: l[2] }
	return (
		l[0] !== void 0 && (c.editorInstance = l[0]),
		(Z = new pg({ props: c })),
		Sl.push(() => SZ(Z, "editorInstance", G)),
		{
			c() {
				K(Z.$$.fragment)
			},
			m(d, W) {
				k(Z, d, W), (m = !0)
			},
			p(d, W) {
				const V = {}
				2 & W && (V.options = d[1]),
					8 & W && (V.model = d[3]),
					4 & W && (V.height = d[2]),
					!b && 1 & W && ((b = !0), (V.editorInstance = d[0]), xZ(() => (b = !1))),
					Z.$set(V)
			},
			i(d) {
				m || (J(Z.$$.fragment, d), (m = !0))
			},
			o(d) {
				o(Z.$$.fragment, d), (m = !1)
			},
			d(d) {
				z(Z, d)
			},
		}
	)
}