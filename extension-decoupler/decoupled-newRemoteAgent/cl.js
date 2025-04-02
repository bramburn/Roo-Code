
function cl(l, Z) {
	let b = typeof l == "string" ? l : l.source
	Z = Z || ""
	const m = {
		replace: (G, c) => {
			let d = typeof c == "string" ? c : c.source
			return (d = d.replace(eY, "$1")), (b = b.replace(G, d)), m
		},
		getRegex: () => new RegExp(b, Z),
	}
	return m
}