
class Kl {
	constructor(Z) {
		Il(this, "options")
		Il(this, "renderer")
		Il(this, "textRenderer")
		;(this.options = Z || Ol),
			(this.options.renderer = this.options.renderer || new FZ()),
			(this.renderer = this.options.renderer),
			(this.renderer.options = this.options),
			(this.textRenderer = new hb())
	}
	static parse(Z, b) {
		return new Kl(b).parse(Z)
	}
	static parseInline(Z, b) {
		return new Kl(b).parseInline(Z)
	}
	parse(Z, b = !0) {
		let m = ""
		for (let G = 0; G < Z.length; G++) {
			const c = Z[G]
			if (
				this.options.extensions &&
				this.options.extensions.renderers &&
				this.options.extensions.renderers[c.type]
			) {
				const d = c,
					W = this.options.extensions.renderers[d.type].call({ parser: this }, d)
				if (
					W !== !1 ||
					![
						"space",
						"hr",
						"heading",
						"code",
						"table",
						"blockquote",
						"list",
						"html",
						"paragraph",
						"text",
					].includes(d.type)
				) {
					m += W || ""
					continue
				}
			}
			switch (c.type) {
				case "space":
					continue
				case "hr":
					m += this.renderer.hr()
					continue
				case "heading": {
					const d = c
					m += this.renderer.heading(
						this.parseInline(d.tokens),
						d.depth,
						zY(this.parseInline(d.tokens, this.textRenderer)),
					)
					continue
				}
				case "code": {
					const d = c
					m += this.renderer.code(d.text, d.lang, !!d.escaped)
					continue
				}
				case "table": {
					const d = c
					let W = "",
						V = ""
					for (let I = 0; I < d.header.length; I++)
						V += this.renderer.tablecell(this.parseInline(d.header[I].tokens), {
							header: !0,
							align: d.align[I],
						})
					W += this.renderer.tablerow(V)
					let X = ""
					for (let I = 0; I < d.rows.length; I++) {
						const i = d.rows[I]
						V = ""
						for (let g = 0; g < i.length; g++)
							V += this.renderer.tablecell(this.parseInline(i[g].tokens), {
								header: !1,
								align: d.align[g],
							})
						X += this.renderer.tablerow(V)
					}
					m += this.renderer.table(W, X)
					continue
				}
				case "blockquote": {
					const d = c,
						W = this.parse(d.tokens)
					m += this.renderer.blockquote(W)
					continue
				}
				case "list": {
					const d = c,
						W = d.ordered,
						V = d.start,
						X = d.loose
					let I = ""
					for (let i = 0; i < d.items.length; i++) {
						const g = d.items[i],
							R = g.checked,
							Y = g.task
						let u = ""
						if (g.task) {
							const p = this.renderer.checkbox(!!R)
							X
								? g.tokens.length > 0 && g.tokens[0].type === "paragraph"
									? ((g.tokens[0].text = p + " " + g.tokens[0].text),
										g.tokens[0].tokens &&
											g.tokens[0].tokens.length > 0 &&
											g.tokens[0].tokens[0].type === "text" &&
											(g.tokens[0].tokens[0].text = p + " " + g.tokens[0].tokens[0].text))
									: g.tokens.unshift({ type: "text", text: p + " " })
								: (u += p + " ")
						}
						;(u += this.parse(g.tokens, X)), (I += this.renderer.listitem(u, Y, !!R))
					}
					m += this.renderer.list(I, W, V)
					continue
				}
				case "html": {
					const d = c
					m += this.renderer.html(d.text, d.block)
					continue
				}
				case "paragraph": {
					const d = c
					m += this.renderer.paragraph(this.parseInline(d.tokens))
					continue
				}
				case "text": {
					let d = c,
						W = d.tokens ? this.parseInline(d.tokens) : d.text
					for (; G + 1 < Z.length && Z[G + 1].type === "text"; )
						(d = Z[++G]),
							(W +=
								`
` + (d.tokens ? this.parseInline(d.tokens) : d.text))
					m += b ? this.renderer.paragraph(W) : W
					continue
				}
				default: {
					const d = 'Token with "' + c.type + '" type was not found.'
					if (this.options.silent) return console.error(d), ""
					throw new Error(d)
				}
			}
		}
		return m
	}
	parseInline(Z, b) {
		b = b || this.renderer
		let m = ""
		for (let G = 0; G < Z.length; G++) {
			const c = Z[G]
			if (
				this.options.extensions &&
				this.options.extensions.renderers &&
				this.options.extensions.renderers[c.type]
			) {
				const d = this.options.extensions.renderers[c.type].call({ parser: this }, c)
				if (
					d !== !1 ||
					!["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(
						c.type,
					)
				) {
					m += d || ""
					continue
				}
			}
			switch (c.type) {
				case "escape": {
					const d = c
					m += b.text(d.text)
					break
				}
				case "html": {
					const d = c
					m += b.html(d.text)
					break
				}
				case "link": {
					const d = c
					m += b.link(d.href, d.title, this.parseInline(d.tokens, b))
					break
				}
				case "image": {
					const d = c
					m += b.image(d.href, d.title, d.text)
					break
				}
				case "strong": {
					const d = c
					m += b.strong(this.parseInline(d.tokens, b))
					break
				}
				case "em": {
					const d = c
					m += b.em(this.parseInline(d.tokens, b))
					break
				}
				case "codespan": {
					const d = c
					m += b.codespan(d.text)
					break
				}
				case "br":
					m += b.br()
					break
				case "del": {
					const d = c
					m += b.del(this.parseInline(d.tokens, b))
					break
				}
				case "text": {
					const d = c
					m += b.text(d.text)
					break
				}
				default: {
					const d = 'Token with "' + c.type + '" type was not found.'
					if (this.options.silent) return console.error(d), ""
					throw new Error(d)
				}
			}
		}
		return m
	}
}