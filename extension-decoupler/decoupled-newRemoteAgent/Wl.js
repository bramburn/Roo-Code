
const wl = new ((qI = class {
	constructor(...l) {
		Fb(this, Ql)
		Il(this, "defaults", {
			async: !1,
			breaks: !1,
			extensions: null,
			gfm: !0,
			hooks: null,
			pedantic: !1,
			renderer: null,
			silent: !1,
			tokenizer: null,
			walkTokens: null,
		})
		Il(this, "options", this.setOptions)
		Il(this, "parse", iZ(this, Ql, Vb).call(this, tl.lex, Kl.parse))
		Il(this, "parseInline", iZ(this, Ql, Vb).call(this, tl.lexInline, Kl.parseInline))
		Il(this, "Parser", Kl)
		Il(this, "Renderer", FZ)
		Il(this, "TextRenderer", hb)
		Il(this, "Lexer", tl)
		Il(this, "Tokenizer", CZ)
		Il(this, "Hooks", GZ)
		this.use(...l)
	}
	walkTokens(l, Z) {
		var m, G
		let b = []
		for (const c of l)
			switch (((b = b.concat(Z.call(this, c))), c.type)) {
				case "table": {
					const d = c
					for (const W of d.header) b = b.concat(this.walkTokens(W.tokens, Z))
					for (const W of d.rows) for (const V of W) b = b.concat(this.walkTokens(V.tokens, Z))
					break
				}
				case "list": {
					const d = c
					b = b.concat(this.walkTokens(d.items, Z))
					break
				}
				default: {
					const d = c
					;(G = (m = this.defaults.extensions) == null ? void 0 : m.childTokens) != null && G[d.type]
						? this.defaults.extensions.childTokens[d.type].forEach((W) => {
								const V = d[W].flat(1 / 0)
								b = b.concat(this.walkTokens(V, Z))
							})
						: d.tokens && (b = b.concat(this.walkTokens(d.tokens, Z)))
				}
			}
		return b
	}
	use(...l) {
		const Z = this.defaults.extensions || { renderers: {}, childTokens: {} }
		return (
			l.forEach((b) => {
				const m = { ...b }
				if (
					((m.async = this.defaults.async || m.async || !1),
					b.extensions &&
						(b.extensions.forEach((G) => {
							if (!G.name) throw new Error("extension name required")
							if ("renderer" in G) {
								const c = Z.renderers[G.name]
								Z.renderers[G.name] = c
									? function (...d) {
											let W = G.renderer.apply(this, d)
											return W === !1 && (W = c.apply(this, d)), W
										}
									: G.renderer
							}
							if ("tokenizer" in G) {
								if (!G.level || (G.level !== "block" && G.level !== "inline"))
									throw new Error("extension level must be 'block' or 'inline'")
								const c = Z[G.level]
								c ? c.unshift(G.tokenizer) : (Z[G.level] = [G.tokenizer]),
									G.start &&
										(G.level === "block"
											? Z.startBlock
												? Z.startBlock.push(G.start)
												: (Z.startBlock = [G.start])
											: G.level === "inline" &&
												(Z.startInline
													? Z.startInline.push(G.start)
													: (Z.startInline = [G.start])))
							}
							"childTokens" in G && G.childTokens && (Z.childTokens[G.name] = G.childTokens)
						}),
						(m.extensions = Z)),
					b.renderer)
				) {
					const G = this.defaults.renderer || new FZ(this.defaults)
					for (const c in b.renderer) {
						if (!(c in G)) throw new Error(`renderer '${c}' does not exist`)
						if (c === "options") continue
						const d = c,
							W = b.renderer[d],
							V = G[d]
						G[d] = (...X) => {
							let I = W.apply(G, X)
							return I === !1 && (I = V.apply(G, X)), I || ""
						}
					}
					m.renderer = G
				}
				if (b.tokenizer) {
					const G = this.defaults.tokenizer || new CZ(this.defaults)
					for (const c in b.tokenizer) {
						if (!(c in G)) throw new Error(`tokenizer '${c}' does not exist`)
						if (["options", "rules", "lexer"].includes(c)) continue
						const d = c,
							W = b.tokenizer[d],
							V = G[d]
						G[d] = (...X) => {
							let I = W.apply(G, X)
							return I === !1 && (I = V.apply(G, X)), I
						}
					}
					m.tokenizer = G
				}
				if (b.hooks) {
					const G = this.defaults.hooks || new GZ()
					for (const c in b.hooks) {
						if (!(c in G)) throw new Error(`hook '${c}' does not exist`)
						if (c === "options") continue
						const d = c,
							W = b.hooks[d],
							V = G[d]
						GZ.passThroughHooks.has(c)
							? (G[d] = (X) => {
									if (this.defaults.async)
										return Promise.resolve(W.call(G, X)).then((i) => V.call(G, i))
									const I = W.call(G, X)
									return V.call(G, I)
								})
							: (G[d] = (...X) => {
									let I = W.apply(G, X)
									return I === !1 && (I = V.apply(G, X)), I
								})
					}
					m.hooks = G
				}
				if (b.walkTokens) {
					const G = this.defaults.walkTokens,
						c = b.walkTokens
					m.walkTokens = function (d) {
						let W = []
						return W.push(c.call(this, d)), G && (W = W.concat(G.call(this, d))), W
					}
				}
				this.defaults = { ...this.defaults, ...m }
			}),
			this
		)
	}
	setOptions(l) {
		return (this.defaults = { ...this.defaults, ...l }), this
	}
	lexer(l, Z) {
		return tl.lex(l, Z ?? this.defaults)
	}
	parser(l, Z) {
		return Kl.parse(l, Z ?? this.defaults)
	}
}),
(Ql = new WeakSet()),
(Vb = function (l, Z) {
	return (b, m) => {
		const G = { ...m },
			c = { ...this.defaults, ...G }
		this.defaults.async === !0 &&
			G.async === !1 &&
			(c.silent ||
				console.warn(
					"marked(): The async option was set to true by an extension. The async: false option sent to parse will be ignored.",
				),
			(c.async = !0))
		const d = iZ(this, Ql, si).call(this, !!c.silent, !!c.async)
		if (b == null) return d(new Error("marked(): input parameter is undefined or null"))
		if (typeof b != "string")
			return d(
				new Error(
					"marked(): input parameter is of type " + Object.prototype.toString.call(b) + ", string expected",
				),
			)
		if ((c.hooks && (c.hooks.options = c), c.async))
			return Promise.resolve(c.hooks ? c.hooks.preprocess(b) : b)
				.then((W) => l(W, c))
				.then((W) => (c.hooks ? c.hooks.processAllTokens(W) : W))
				.then((W) => (c.walkTokens ? Promise.all(this.walkTokens(W, c.walkTokens)).then(() => W) : W))
				.then((W) => Z(W, c))
				.then((W) => (c.hooks ? c.hooks.postprocess(W) : W))
				.catch(d)
		try {
			c.hooks && (b = c.hooks.preprocess(b))
			let W = l(b, c)
			c.hooks && (W = c.hooks.processAllTokens(W)), c.walkTokens && this.walkTokens(W, c.walkTokens)
			let V = Z(W, c)
			return c.hooks && (V = c.hooks.postprocess(V)), V
		} catch (W) {
			return d(W)
		}
	}
}),
(si = function (l, Z) {
	return (b) => {
		if (
			((b.message += `
Please report this to https://github.com/markedjs/marked.`),
			l)
		) {
			const m = "<p>An error occurred:</p><pre>" + Ll(b.message + "", !0) + "</pre>"
			return Z ? Promise.resolve(m) : m
		}
		if (Z) return Promise.reject(b)
		throw b
	}
}),
qI)()