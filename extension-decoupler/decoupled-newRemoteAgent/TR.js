
function tR(l, Z, b) {
	let m,
		G,
		c,
		{ $$slots: d = {}, $$scope: W } = Z,
		{ options: V } = Z,
		{ size: X = 2 } = Z,
		{ disabled: I = !1 } = Z,
		{ onSelectOption: i } = Z,
		{ activeOption: g = V[0] } = Z
	function R(h) {
		!I && i(h) && b(7, (g = h))
	}
	function Y() {
		const h = m == null ? void 0 : m.querySelectorAll(".c-toggle-button__button")
		if (!h) return
		const y = h[V.indexOf(g)]
		if (m && G && y) {
			const a = y.getBoundingClientRect(),
				n = m.getBoundingClientRect()
			b(4, (G.style.left = a.left - n.left + "px"), G),
				b(4, (G.style.width = `${a.width}px`), G),
				b(4, (G.style.height = `${a.height}px`), G)
		}
	}
	let u,
		p = !1
	return (
		WZ(() => {
			c == null || c.disconnect(), b(9, (c = void 0)), clearTimeout(u)
		}),
		(l.$$set = (h) => {
			"options" in h && b(0, (V = h.options)),
				"size" in h && b(1, (X = h.size)),
				"disabled" in h && b(2, (I = h.disabled)),
				"onSelectOption" in h && b(8, (i = h.onSelectOption)),
				"activeOption" in h && b(7, (g = h.activeOption)),
				"$$scope" in h && b(15, (W = h.$$scope))
		}),
		(l.$$.update = () => {
			128 & l.$$.dirty && g && Y(),
				1544 & l.$$.dirty &&
					m &&
					!c &&
					(b(
						9,
						(c = new ResizeObserver(() => {
							b(5, (p = !0)),
								Y(),
								clearTimeout(u),
								b(
									10,
									(u = setTimeout(() => {
										b(5, (p = !1))
									}, 100)),
								)
						})),
					),
					c.observe(m))
		}),
		[
			V,
			X,
			I,
			m,
			G,
			p,
			R,
			g,
			i,
			c,
			u,
			d,
			function (h) {
				Sl[h ? "unshift" : "push"](() => {
					;(G = h), b(4, G)
				})
			},
			(h) => R(h),
			function (h) {
				Sl[h ? "unshift" : "push"](() => {
					;(m = h), b(3, m)
				})
			},
			W,
		]
	)
}