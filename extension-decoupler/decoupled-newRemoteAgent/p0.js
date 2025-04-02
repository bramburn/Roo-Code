
function P0(l, Z, b) {
	let { token: m } = Z
	return (
		(l.$$set = (G) => {
			"token" in G && b(0, (m = G.token))
		}),
		[m, void 0, void 0]
	)
}