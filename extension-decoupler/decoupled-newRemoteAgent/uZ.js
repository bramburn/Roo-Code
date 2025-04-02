
function uZ(l, Z, b) {
	const m = l.length
	if (m === 0) return ""
	let G = 0
	for (; G < m; ) {
		const c = l.charAt(m - G - 1)
		if (c !== Z || b) {
			if (c === Z || !b) break
			G++
		} else G++
	}
	return l.slice(0, m - G)
}