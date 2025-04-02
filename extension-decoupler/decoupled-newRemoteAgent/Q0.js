
function q0(l, Z, b) {
	let { token: m } = Z,
		{ options: G } = Z,
		{ renderers: c } = Z
	return (
		(l.$$set = (d) => {
			"token" in d && b(0, (m = d.token)),
				"options" in d && b(1, (G = d.options)),
				"renderers" in d && b(2, (c = d.renderers))
		}),
		[m, G, c]
	)
}