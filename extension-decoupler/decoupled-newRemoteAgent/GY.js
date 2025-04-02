
function gY(l, Z, b) {
	let { $$slots: m = {}, $$scope: G } = Z
	return (
		(l.$$set = (c) => {
			"$$scope" in c && b(3, (G = c.$$scope))
		}),
		[void 0, void 0, void 0, G, m]
	)
}