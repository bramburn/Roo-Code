
function ym(l, Z, b, m) {
	const G = Z.href,
		c = Z.title ? Ll(Z.title) : null,
		d = l[1].replace(/\\([\[\]])/g, "$1")
	if (l[0].charAt(0) !== "!") {
		m.state.inLink = !0
		const W = { type: "link", raw: b, href: G, title: c, text: d, tokens: m.inlineTokens(d) }
		return (m.state.inLink = !1), W
	}
	return { type: "image", raw: b, href: G, title: c, text: Ll(d) }
}