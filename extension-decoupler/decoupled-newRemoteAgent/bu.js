
function bu(l, Z, b) {
	let m,
		G,
		c,
		d,
		W,
		V,
		X,
		I = A,
		i = () => (I(), (I = $i(h, (n) => b(1, (W = n)))), h)
	l.$$.on_destroy.push(() => I())
	let { agentId: g } = Z
	const R = Zb("agentManagerModel")
	Pl(l, R, (n) => b(3, (X = n)))
	const Y = Zb(Wi.key)
	Pl(l, Y, (n) => b(2, (V = n)))
	let u = "changedFiles"
	const p = [
		{ label: "Changed files", value: "changedFiles" },
		{ label: "Summary", value: "summary" },
	]
	let h = ib(-1)
	i()
	let y = !1,
		a = !1
	return (
		jl(() => {
			Y.setCurrentAgent(g)
		}),
		(l.$$set = (n) => {
			"agentId" in n && b(0, (g = n.agentId))
		}),
		(l.$$.update = () => {
			var n, N, C
			8 & l.$$.dirty && b(10, (m = (X == null ? void 0 : X.showAgentList) ?? (() => {}))),
				5 & l.$$.dirty &&
					b(
						9,
						(G =
							(n = V == null ? void 0 : V.agentOverviews) == null
								? void 0
								: n.find((T) => T.remote_agent_id === g)),
					),
				4 & l.$$.dirty &&
					b(
						15,
						(c = ((N = V == null ? void 0 : V.currentConversation) == null ? void 0 : N.exchanges) ?? []),
					),
				32770 & l.$$.dirty &&
					b(
						8,
						(d =
							((C = c[W]) == null ? void 0 : C.changed_files) ??
							((T) => {
								const L = T.flatMap((M) => M.changed_files)
								let U = {}
								for (const M of L) {
									const Q = U[M.new_path]
									U[M.new_path] = Q ? { ...Q, new_contents: M.new_contents, new_path: M.new_path } : M
								}
								return Object.values(U)
							})(c)),
					)
		}),
		[
			g,
			W,
			V,
			X,
			u,
			h,
			y,
			a,
			d,
			G,
			m,
			R,
			Y,
			p,
			(n, N, C) => {
				V == null || V.applyChanges(n, N, C)
			},
			c,
			async () => {
				b(6, (y = !0)), await Y.deleteAgent(G.remote_agent_id), b(6, (y = !1)), X.showAgentList()
			},
			() => {
				l2(h, (W = -1), W)
			},
			(n) => {
				var N
				return b(4, (u = ((N = p.find((C) => C.label === n)) == null ? void 0 : N.value) ?? "changedFiles")), !0
			},
			function (n) {
				;(h = n), i(b(5, h))
			},
			function (n) {
				;(a = n), b(7, a)
			},
		]
	)
}