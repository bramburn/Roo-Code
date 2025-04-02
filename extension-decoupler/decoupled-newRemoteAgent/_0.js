
function _0(l) {
	let Z,
		b,
		m,
		G,
		c,
		d,
		W = il(l[0].header),
		V = []
	for (let R = 0; R < W.length; R += 1) V[R] = Im(Xm(l, W, R))
	const X = (R) =>
		o(V[R], 1, 1, () => {
			V[R] = null
		})
	let I = il(l[0].rows),
		i = []
	for (let R = 0; R < I.length; R += 1) i[R] = Ym(Wm(l, I, R))
	const g = (R) =>
		o(i[R], 1, 1, () => {
			i[R] = null
		})
	return {
		c() {
			;(Z = F("table")), (b = F("thead")), (m = F("tr"))
			for (let R = 0; R < V.length; R += 1) V[R].c()
			;(G = E()), (c = F("tbody"))
			for (let R = 0; R < i.length; R += 1) i[R].c()
		},
		m(R, Y) {
			S(R, Z, Y), H(Z, b), H(b, m)
			for (let u = 0; u < V.length; u += 1) V[u] && V[u].m(m, null)
			H(Z, G), H(Z, c)
			for (let u = 0; u < i.length; u += 1) i[u] && i[u].m(c, null)
			d = !0
		},
		p(R, [Y]) {
			if (7 & Y) {
				let u
				for (W = il(R[0].header), u = 0; u < W.length; u += 1) {
					const p = Xm(R, W, u)
					V[u] ? (V[u].p(p, Y), J(V[u], 1)) : ((V[u] = Im(p)), V[u].c(), J(V[u], 1), V[u].m(m, null))
				}
				for (q(), u = W.length; u < V.length; u += 1) X(u)
				$()
			}
			if (7 & Y) {
				let u
				for (I = il(R[0].rows), u = 0; u < I.length; u += 1) {
					const p = Wm(R, I, u)
					i[u] ? (i[u].p(p, Y), J(i[u], 1)) : ((i[u] = Ym(p)), i[u].c(), J(i[u], 1), i[u].m(c, null))
				}
				for (q(), u = I.length; u < i.length; u += 1) g(u)
				$()
			}
		},
		i(R) {
			if (!d) {
				for (let Y = 0; Y < W.length; Y += 1) J(V[Y])
				for (let Y = 0; Y < I.length; Y += 1) J(i[Y])
				d = !0
			}
		},
		o(R) {
			V = V.filter(Boolean)
			for (let Y = 0; Y < V.length; Y += 1) o(V[Y])
			i = i.filter(Boolean)
			for (let Y = 0; Y < i.length; Y += 1) o(i[Y])
			d = !1
		},
		d(R) {
			R && x(Z), Tl(V, R), Tl(i, R)
		},
	}
}