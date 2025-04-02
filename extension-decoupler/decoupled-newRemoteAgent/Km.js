
function km(l, Z, { key: b }) {
	let m = 0
	const G = l[b],
		c = {},
		d = {}
	for (let W = 1; W <= Z.length; W++) (d[W + m] = G[W]), (c[W + m] = !0), (m += Ti(Z[W - 1]))
	;(l[b] = d), (l[b]._emit = c), (l[b]._multi = !0)
}