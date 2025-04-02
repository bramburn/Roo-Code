
function yR(l, Z, b) {
	let { markdown: m } = Z
	const G = { codespan: aR }
	return (
		(l.$$set = (c) => {
			"markdown" in c && b(0, (m = c.markdown))
		}),
		[m, (c) => c.replace(/`?#[0-9a-fA-F]{3,6}`?/g, (d) => (d.startsWith("`") ? d : `\`${d}\``)), G]
	)
}