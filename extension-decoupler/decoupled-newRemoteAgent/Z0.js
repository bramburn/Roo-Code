
function z0(l, Z, b) {
	let m,
		{ token: G } = Z,
		{ options: c } = Z,
		{ renderers: d } = Z
	return (
		(l.$$set = (W) => {
			"token" in W && b(0, (G = W.token)),
				"options" in W && b(1, (c = W.options)),
				"renderers" in W && b(2, (d = W.renderers))
		}),
		(l.$$.update = () => {
			1 & l.$$.dirty && b(3, (m = G.ordered ? "ol" : "ul"))
		}),
		[G, c, d, m]
	)
}