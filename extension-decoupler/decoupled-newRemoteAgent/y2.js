
function y2(l) {
	let Z, b, m, G, c, d
	return (
		(m = new Bl({ props: { size: 2, $$slots: { default: [N2] }, $$scope: { ctx: l } } })),
		(c = new Yb({ props: { size: 1, useCurrentColor: !0 } })),
		{
			c() {
				;(Z = F("div")),
					(b = F("div")),
					K(m.$$.fragment),
					(G = E()),
					K(c.$$.fragment),
					B(b, "class", "loading-container svelte-2i3162"),
					B(Z, "class", "remote-agent-chat-loading svelte-2i3162")
			},
			m(W, V) {
				S(W, Z, V), H(Z, b), k(m, b, null), H(b, G), k(c, b, null), (d = !0)
			},
			p(W, V) {
				const X = {}
				1024 & V && (X.$$scope = { dirty: V, ctx: W }), m.$set(X)
			},
			i(W) {
				d || (J(m.$$.fragment, W), J(c.$$.fragment, W), (d = !0))
			},
			o(W) {
				o(m.$$.fragment, W), o(c.$$.fragment, W), (d = !1)
			},
			d(W) {
				W && x(Z), z(m), z(c)
			},
		}
	)
}