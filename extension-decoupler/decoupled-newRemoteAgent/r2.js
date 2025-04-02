
function r2(l, Z, b) {
	let m,
		{ changedFiles: G } = Z,
		{ onApplyChanges: c } = Z,
		{ pendingFiles: d = [] } = Z,
		{ appliedFiles: W = [] } = Z
	return (
		(l.$$set = (V) => {
			"changedFiles" in V && b(4, (G = V.changedFiles)),
				"onApplyChanges" in V && b(0, (c = V.onApplyChanges)),
				"pendingFiles" in V && b(1, (d = V.pendingFiles)),
				"appliedFiles" in V && b(2, (W = V.appliedFiles))
		}),
		(l.$$.update = () => {
			16 & l.$$.dirty &&
				b(
					3,
					(m = G.map((V) => {
						const X = x2(V.old_contents || "", V.new_contents || "")
						return {
							qualifiedPathName: { rootPath: "", relPath: V.new_path || V.old_path },
							lineChanges: X,
							oldContents: V.old_contents || "",
							newContents: V.new_contents || "",
							diff: {
								id: "",
								path: V.new_path || V.old_path,
								diff: X.diff,
								originalCode: V.old_contents || "",
								modifiedCode: V.new_contents || "",
							},
						}
					})),
				)
		}),
		[
			c,
			d,
			W,
			m,
			G,
			(V) => {
				c(V.qualifiedPathName.relPath, V.oldContents, V.newContents)
			},
		]
	)
}