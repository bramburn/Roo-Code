
function tb(l, Z) {
	var b
	for (b = 0; b < l.length && b < Z.length; b++) if (l[b] != Z[b]) return l.slice(0, b)
	return l.slice(0, b)
}