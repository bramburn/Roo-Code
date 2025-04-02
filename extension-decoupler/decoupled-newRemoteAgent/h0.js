
function H0(l, Z, b) {
	let { tokens: m } = Z,
		{ renderers: G } = Z,
		{ options: c } = Z
	return (
		(l.$$set = (d) => {
			"tokens" in d && b(0, (m = d.tokens)),
				"renderers" in d && b(1, (G = d.renderers)),
				"options" in d && b(2, (c = d.options))
		}),
		[m, G, c]
	)
}