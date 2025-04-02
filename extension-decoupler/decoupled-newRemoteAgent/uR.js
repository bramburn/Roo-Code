
function UR(l) {
	let Z,
		b,
		m,
		G,
		c = il(l[0]),
		d = []
	for (let V = 0; V < c.length; V += 1) d[V] = PI(AI(l, c, V))
	const W = (V) =>
		o(d[V], 1, 1, () => {
			d[V] = null
		})
	return {
		c() {
			;(Z = F("div")), (b = F("div")), (m = E())
			for (let V = 0; V < d.length; V += 1) d[V].c()
			B(b, "class", "background-slider"),
				B(Z, "class", "c-toggle-button svelte-u7r5mp"),
				bl(Z, "c-toggle-button--disabled", l[2]),
				bl(Z, "c-toggle-button--size-1", l[1] === 1),
				bl(Z, "c-toggle-button--size-2", l[1] === 2),
				bl(Z, "c-toggle-button--size-3", l[1] === 3),
				bl(Z, "c-toggle-button--size-4", l[1] === 4),
				bl(Z, "c-toggle-button--resizing", l[5])
		},
		m(V, X) {
			S(V, Z, X), H(Z, b), l[12](b), H(Z, m)
			for (let I = 0; I < d.length; I += 1) d[I] && d[I].m(Z, null)
			l[14](Z), (G = !0)
		},
		p(V, [X]) {
			if (32839 & X) {
				let I
				for (c = il(V[0]), I = 0; I < c.length; I += 1) {
					const i = AI(V, c, I)
					d[I] ? (d[I].p(i, X), J(d[I], 1)) : ((d[I] = PI(i)), d[I].c(), J(d[I], 1), d[I].m(Z, null))
				}
				for (q(), I = c.length; I < d.length; I += 1) W(I)
				$()
			}
			;(!G || 4 & X) && bl(Z, "c-toggle-button--disabled", V[2]),
				(!G || 2 & X) && bl(Z, "c-toggle-button--size-1", V[1] === 1),
				(!G || 2 & X) && bl(Z, "c-toggle-button--size-2", V[1] === 2),
				(!G || 2 & X) && bl(Z, "c-toggle-button--size-3", V[1] === 3),
				(!G || 2 & X) && bl(Z, "c-toggle-button--size-4", V[1] === 4),
				(!G || 32 & X) && bl(Z, "c-toggle-button--resizing", V[5])
		},
		i(V) {
			if (!G) {
				for (let X = 0; X < c.length; X += 1) J(d[X])
				G = !0
			}
		},
		o(V) {
			d = d.filter(Boolean)
			for (let X = 0; X < d.length; X += 1) o(d[X])
			G = !1
		},
		d(V) {
			V && x(Z), l[12](null), Tl(d, V), l[14](null)
		},
	}
}