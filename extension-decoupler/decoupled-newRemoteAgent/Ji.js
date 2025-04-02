
function jI(l) {
	let Z, b, m
	function G() {
		return l[14](l[27])
	}
	let c = {
		path: l[27].path,
		change: l[27],
		isExpanded: l[6],
		isApplying: l[1].includes(l[27].path),
		hasApplied: l[2].includes(l[27].path),
		onApplyChanges: G,
	}
	return (
		(b = new n0({ props: c })),
		l[15](b),
		{
			c() {
				;(Z = F("div")), K(b.$$.fragment), B(Z, "class", "c-diff-view__changes-item svelte-ru5a2s")
			},
			m(d, W) {
				S(d, Z, W), k(b, Z, null), (m = !0)
			},
			p(d, W) {
				l = d
				const V = {}
				8 & W && (V.path = l[27].path),
					8 & W && (V.change = l[27]),
					64 & W && (V.isExpanded = l[6]),
					10 & W && (V.isApplying = l[1].includes(l[27].path)),
					12 & W && (V.hasApplied = l[2].includes(l[27].path)),
					9 & W && (V.onApplyChanges = G),
					b.$set(V)
			},
			i(d) {
				m || (J(b.$$.fragment, d), (m = !0))
			},
			o(d) {
				o(b.$$.fragment, d), (m = !1)
			},
			d(d) {
				d && x(Z), l[15](null), z(b)
			},
		}
	)
}