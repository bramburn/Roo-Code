
function _g(l, Z, b) {
	let m,
		{ text: G } = Z,
		{ lang: c } = Z,
		{ pathName: d } = Z,
		{ options: W = {} } = Z,
		{ editorInstance: V } = Z,
		{ height: X } = Z
	const I = d2.getLanguages().map((g) => g.id)
	let i
	return (
		el.addKeybindingRules([
			{ keybinding: UZ.CtrlCmd | YZ.KeyF, command: null },
			{ keybinding: UZ.CtrlCmd | YZ.KeyL, command: null },
			{ keybinding: UZ.CtrlCmd | YZ.Shift | YZ.KeyK, command: null },
		]),
		WZ(() => {
			i == null || i.dispose()
		}),
		(l.$$set = (g) => {
			"text" in g && b(4, (G = g.text)),
				"lang" in g && b(5, (c = g.lang)),
				"pathName" in g && b(6, (d = g.pathName)),
				"options" in g && b(1, (W = g.options)),
				"editorInstance" in g && b(0, (V = g.editorInstance)),
				"height" in g && b(2, (X = g.height))
		}),
		(l.$$.update = () => {
			48 & l.$$.dirty && b(7, (m = c && I.includes(c) ? c : Pg.highlightAuto(G, I).language)),
				64 & l.$$.dirty &&
					((g) => {
						const R = g
							? NZ.parse(`file://${g}#${crypto.randomUUID()}`)
							: NZ.parse(`file://#${crypto.randomUUID()}`)
						i == null || i.dispose(), b(3, (i = el.createModel(G, m, R)))
					})(d),
				24 & l.$$.dirty && (i == null || i.setValue(G)),
				136 & l.$$.dirty && i && m && el.setModelLanguage(i, m)
		}),
		[
			V,
			W,
			X,
			i,
			G,
			c,
			d,
			m,
			function (g) {
				;(V = g), b(0, V)
			},
		]
	)
}