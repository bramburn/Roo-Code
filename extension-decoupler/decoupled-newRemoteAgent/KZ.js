
function kZ(l, Z) {
	;(Z == null || Z > l.length) && (Z = l.length)
	for (var b = 0, m = new Array(Z); b < Z; b++) m[b] = l[b]
	return m
}