
function kR(l) {
	let Z, b, m, G, c, d, W, V, X, I, i, g, R, Y, u, p
	function h(a) {
		l[20](a)
	}
	;(b = new u2({ props: { agentId: l[0] } })),
		(d = new Bl({ props: { size: 4, $$slots: { default: [eR] }, $$scope: { ctx: l } } })),
		(V = new R2({ props: { status: l[9].status } })),
		(i = new gb({
			props: {
				triggerOn: [V2.Hover],
				content: l[6] ? "Deleting..." : "Delete agent",
				$$slots: { default: [ER] },
				$$scope: { ctx: l },
			},
		}))
	let y = {
		initialPercentage: lu,
		side: "both",
		minPercentage: 20,
		maxPercentage: 80,
		deadzone: 60,
		showButton: !0,
		class: "agent-detail-drawer",
		$$slots: { right: [rR], left: [QR] },
		$$scope: { ctx: l },
	}
	return (
		l[7] !== void 0 && (y.minimized = l[7]),
		(Y = new m0({ props: y })),
		Sl.push(() => SZ(Y, "minimized", h)),
		{
			c() {
				;(Z = F("div")),
					K(b.$$.fragment),
					(m = E()),
					(G = F("div")),
					(c = F("div")),
					K(d.$$.fragment),
					(W = E()),
					K(V.$$.fragment),
					(X = E()),
					(I = F("div")),
					K(i.$$.fragment),
					(g = E()),
					(R = F("div")),
					K(Y.$$.fragment),
					B(c, "class", "summary--text svelte-1bnkwkr"),
					B(I, "class", "summary--button svelte-1bnkwkr"),
					B(G, "class", "summary svelte-1bnkwkr"),
					B(R, "class", "layout svelte-1bnkwkr"),
					B(Z, "class", "agent-detail svelte-1bnkwkr")
			},
			m(a, n) {
				S(a, Z, n),
					k(b, Z, null),
					H(Z, m),
					H(Z, G),
					H(G, c),
					k(d, c, null),
					H(G, W),
					k(V, G, null),
					H(G, X),
					H(G, I),
					k(i, I, null),
					H(Z, g),
					H(Z, R),
					k(Y, R, null),
					(p = !0)
			},
			p(a, n) {
				const N = {}
				1 & n && (N.agentId = a[0]), b.$set(N)
				const C = {}
				4194816 & n && (C.$$scope = { dirty: n, ctx: a }), d.$set(C)
				const T = {}
				512 & n && (T.status = a[9].status), V.$set(T)
				const L = {}
				64 & n && (L.content = a[6] ? "Deleting..." : "Delete agent"),
					4194888 & n && (L.$$scope = { dirty: n, ctx: a }),
					i.$set(L)
				const U = {}
				4194615 & n && (U.$$scope = { dirty: n, ctx: a }),
					!u && 128 & n && ((u = !0), (U.minimized = a[7]), xZ(() => (u = !1))),
					Y.$set(U)
			},
			i(a) {
				p ||
					(J(b.$$.fragment, a),
					J(d.$$.fragment, a),
					J(V.$$.fragment, a),
					J(i.$$.fragment, a),
					J(Y.$$.fragment, a),
					(p = !0))
			},
			o(a) {
				o(b.$$.fragment, a),
					o(d.$$.fragment, a),
					o(V.$$.fragment, a),
					o(i.$$.fragment, a),
					o(Y.$$.fragment, a),
					(p = !1)
			},
			d(a) {
				a && x(Z), z(b), z(d), z(V), z(i), z(Y)
			},
		}
	)
}