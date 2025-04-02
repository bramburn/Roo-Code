
function zb(l, Z, b, m) {
	if (Z && b) {
		var G = Z.value.match(/^\s*/)[0],
			c = Z.value.match(/\s*$/)[0],
			d = b.value.match(/^\s*/)[0],
			W = b.value.match(/\s*$/)[0]
		if (l) {
			var V = tb(G, d)
			;(l.value = mb(l.value, d, V)), (Z.value = lZ(Z.value, V)), (b.value = lZ(b.value, V))
		}
		if (m) {
			var X = Kb(c, W)
			;(m.value = bb(m.value, W, X)), (Z.value = gZ(Z.value, X)), (b.value = gZ(b.value, X))
		}
	} else if (b) l && (b.value = b.value.replace(/^\s*/, "")), m && (m.value = m.value.replace(/^\s*/, ""))
	else if (l && m) {
		var I = m.value.match(/^\s*/)[0],
			i = Z.value.match(/^\s*/)[0],
			g = Z.value.match(/\s*$/)[0],
			R = tb(I, i)
		Z.value = lZ(Z.value, R)
		var Y = Kb(lZ(I, R), g)
		;(Z.value = gZ(Z.value, Y)),
			(m.value = bb(m.value, I, Y)),
			(l.value = mb(l.value, I, I.slice(0, I.length - Y.length)))
	} else if (m) {
		var u = m.value.match(/^\s*/)[0],
			p = kb(Z.value.match(/\s*$/)[0], u)
		Z.value = gZ(Z.value, p)
	} else if (l) {
		var h = kb(l.value.match(/\s*$/)[0], Z.value.match(/^\s*/)[0])
		Z.value = lZ(Z.value, h)
	}
}