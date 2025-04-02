
function kb(l, Z) {
	return Z.slice(
		0,
		(function (b, m) {
			var G = 0
			b.length > m.length && (G = b.length - m.length)
			var c = m.length
			b.length < m.length && (c = b.length)
			var d = Array(c),
				W = 0
			d[0] = 0
			for (var V = 1; V < c; V++) {
				for (m[V] == m[W] ? (d[V] = d[W]) : (d[V] = W); W > 0 && m[V] != m[W]; ) W = d[W]
				m[V] == m[W] && W++
			}
			W = 0
			for (var X = G; X < b.length; X++) {
				for (; W > 0 && b[X] != m[W]; ) W = d[W]
				b[X] == m[W] && W++
			}
			return W
		})(l, Z),
	)
}