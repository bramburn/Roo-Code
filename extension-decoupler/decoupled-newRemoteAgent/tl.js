
class tl {
	constructor(Z) {
		Il(this, "tokens")
		Il(this, "options")
		Il(this, "state")
		Il(this, "tokenizer")
		Il(this, "inlineQueue")
		;(this.tokens = []),
			(this.tokens.links = Object.create(null)),
			(this.options = Z || Ol),
			(this.options.tokenizer = this.options.tokenizer || new CZ()),
			(this.tokenizer = this.options.tokenizer),
			(this.tokenizer.options = this.options),
			(this.tokenizer.lexer = this),
			(this.inlineQueue = []),
			(this.state = { inLink: !1, inRawBlock: !1, top: !0 })
		const b = { block: aZ.normal, inline: bZ.normal }
		this.options.pedantic
			? ((b.block = aZ.pedantic), (b.inline = bZ.pedantic))
			: this.options.gfm &&
				((b.block = aZ.gfm), this.options.breaks ? (b.inline = bZ.breaks) : (b.inline = bZ.gfm)),
			(this.tokenizer.rules = b)
	}
	static get rules() {
		return { block: aZ, inline: bZ }
	}
	static lex(Z, b) {
		return new tl(b).lex(Z)
	}
	static lexInline(Z, b) {
		return new tl(b).inlineTokens(Z)
	}
	lex(Z) {
		;(Z = Z.replace(
			/\r\n|\r/g,
			`
`,
		)),
			this.blockTokens(Z, this.tokens)
		for (let b = 0; b < this.inlineQueue.length; b++) {
			const m = this.inlineQueue[b]
			this.inlineTokens(m.src, m.tokens)
		}
		return (this.inlineQueue = []), this.tokens
	}
	blockTokens(Z, b = []) {
		let m, G, c, d
		for (
			Z = this.options.pedantic
				? Z.replace(/\t/g, "    ").replace(/^ +$/gm, "")
				: Z.replace(/^( *)(\t+)/gm, (W, V, X) => V + "    ".repeat(X.length));
			Z;

		)
			if (
				!(
					this.options.extensions &&
					this.options.extensions.block &&
					this.options.extensions.block.some(
						(W) =>
							!!(m = W.call({ lexer: this }, Z, b)) && ((Z = Z.substring(m.raw.length)), b.push(m), !0),
					)
				)
			)
				if ((m = this.tokenizer.space(Z)))
					(Z = Z.substring(m.raw.length)),
						m.raw.length === 1 && b.length > 0
							? (b[b.length - 1].raw += `
`)
							: b.push(m)
				else if ((m = this.tokenizer.code(Z)))
					(Z = Z.substring(m.raw.length)),
						(G = b[b.length - 1]),
						!G || (G.type !== "paragraph" && G.type !== "text")
							? b.push(m)
							: ((G.raw +=
									`
` + m.raw),
								(G.text +=
									`
` + m.text),
								(this.inlineQueue[this.inlineQueue.length - 1].src = G.text))
				else if ((m = this.tokenizer.fences(Z))) (Z = Z.substring(m.raw.length)), b.push(m)
				else if ((m = this.tokenizer.heading(Z))) (Z = Z.substring(m.raw.length)), b.push(m)
				else if ((m = this.tokenizer.hr(Z))) (Z = Z.substring(m.raw.length)), b.push(m)
				else if ((m = this.tokenizer.blockquote(Z))) (Z = Z.substring(m.raw.length)), b.push(m)
				else if ((m = this.tokenizer.list(Z))) (Z = Z.substring(m.raw.length)), b.push(m)
				else if ((m = this.tokenizer.html(Z))) (Z = Z.substring(m.raw.length)), b.push(m)
				else if ((m = this.tokenizer.def(Z)))
					(Z = Z.substring(m.raw.length)),
						(G = b[b.length - 1]),
						!G || (G.type !== "paragraph" && G.type !== "text")
							? this.tokens.links[m.tag] || (this.tokens.links[m.tag] = { href: m.href, title: m.title })
							: ((G.raw +=
									`
` + m.raw),
								(G.text +=
									`
` + m.raw),
								(this.inlineQueue[this.inlineQueue.length - 1].src = G.text))
				else if ((m = this.tokenizer.table(Z))) (Z = Z.substring(m.raw.length)), b.push(m)
				else if ((m = this.tokenizer.lheading(Z))) (Z = Z.substring(m.raw.length)), b.push(m)
				else {
					if (((c = Z), this.options.extensions && this.options.extensions.startBlock)) {
						let W = 1 / 0
						const V = Z.slice(1)
						let X
						this.options.extensions.startBlock.forEach((I) => {
							;(X = I.call({ lexer: this }, V)), typeof X == "number" && X >= 0 && (W = Math.min(W, X))
						}),
							W < 1 / 0 && W >= 0 && (c = Z.substring(0, W + 1))
					}
					if (this.state.top && (m = this.tokenizer.paragraph(c)))
						(G = b[b.length - 1]),
							d && G.type === "paragraph"
								? ((G.raw +=
										`
` + m.raw),
									(G.text +=
										`
` + m.text),
									this.inlineQueue.pop(),
									(this.inlineQueue[this.inlineQueue.length - 1].src = G.text))
								: b.push(m),
							(d = c.length !== Z.length),
							(Z = Z.substring(m.raw.length))
					else if ((m = this.tokenizer.text(Z)))
						(Z = Z.substring(m.raw.length)),
							(G = b[b.length - 1]),
							G && G.type === "text"
								? ((G.raw +=
										`
` + m.raw),
									(G.text +=
										`
` + m.text),
									this.inlineQueue.pop(),
									(this.inlineQueue[this.inlineQueue.length - 1].src = G.text))
								: b.push(m)
					else if (Z) {
						const W = "Infinite loop on byte: " + Z.charCodeAt(0)
						if (this.options.silent) {
							console.error(W)
							break
						}
						throw new Error(W)
					}
				}
		return (this.state.top = !0), b
	}
	inline(Z, b = []) {
		return this.inlineQueue.push({ src: Z, tokens: b }), b
	}
	inlineTokens(Z, b = []) {
		let m,
			G,
			c,
			d,
			W,
			V,
			X = Z
		if (this.tokens.links) {
			const I = Object.keys(this.tokens.links)
			if (I.length > 0)
				for (; (d = this.tokenizer.rules.inline.reflinkSearch.exec(X)) != null; )
					I.includes(d[0].slice(d[0].lastIndexOf("[") + 1, -1)) &&
						(X =
							X.slice(0, d.index) +
							"[" +
							"a".repeat(d[0].length - 2) +
							"]" +
							X.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex))
		}
		for (; (d = this.tokenizer.rules.inline.blockSkip.exec(X)) != null; )
			X =
				X.slice(0, d.index) +
				"[" +
				"a".repeat(d[0].length - 2) +
				"]" +
				X.slice(this.tokenizer.rules.inline.blockSkip.lastIndex)
		for (; (d = this.tokenizer.rules.inline.anyPunctuation.exec(X)) != null; )
			X = X.slice(0, d.index) + "++" + X.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex)
		for (; Z; )
			if (
				(W || (V = ""),
				(W = !1),
				!(
					this.options.extensions &&
					this.options.extensions.inline &&
					this.options.extensions.inline.some(
						(I) =>
							!!(m = I.call({ lexer: this }, Z, b)) && ((Z = Z.substring(m.raw.length)), b.push(m), !0),
					)
				))
			)
				if ((m = this.tokenizer.escape(Z))) (Z = Z.substring(m.raw.length)), b.push(m)
				else if ((m = this.tokenizer.tag(Z)))
					(Z = Z.substring(m.raw.length)),
						(G = b[b.length - 1]),
						G && m.type === "text" && G.type === "text" ? ((G.raw += m.raw), (G.text += m.text)) : b.push(m)
				else if ((m = this.tokenizer.link(Z))) (Z = Z.substring(m.raw.length)), b.push(m)
				else if ((m = this.tokenizer.reflink(Z, this.tokens.links)))
					(Z = Z.substring(m.raw.length)),
						(G = b[b.length - 1]),
						G && m.type === "text" && G.type === "text" ? ((G.raw += m.raw), (G.text += m.text)) : b.push(m)
				else if ((m = this.tokenizer.emStrong(Z, X, V))) (Z = Z.substring(m.raw.length)), b.push(m)
				else if ((m = this.tokenizer.codespan(Z))) (Z = Z.substring(m.raw.length)), b.push(m)
				else if ((m = this.tokenizer.br(Z))) (Z = Z.substring(m.raw.length)), b.push(m)
				else if ((m = this.tokenizer.del(Z))) (Z = Z.substring(m.raw.length)), b.push(m)
				else if ((m = this.tokenizer.autolink(Z))) (Z = Z.substring(m.raw.length)), b.push(m)
				else if (this.state.inLink || !(m = this.tokenizer.url(Z))) {
					if (((c = Z), this.options.extensions && this.options.extensions.startInline)) {
						let I = 1 / 0
						const i = Z.slice(1)
						let g
						this.options.extensions.startInline.forEach((R) => {
							;(g = R.call({ lexer: this }, i)), typeof g == "number" && g >= 0 && (I = Math.min(I, g))
						}),
							I < 1 / 0 && I >= 0 && (c = Z.substring(0, I + 1))
					}
					if ((m = this.tokenizer.inlineText(c)))
						(Z = Z.substring(m.raw.length)),
							m.raw.slice(-1) !== "_" && (V = m.raw.slice(-1)),
							(W = !0),
							(G = b[b.length - 1]),
							G && G.type === "text" ? ((G.raw += m.raw), (G.text += m.text)) : b.push(m)
					else if (Z) {
						const I = "Infinite loop on byte: " + Z.charCodeAt(0)
						if (this.options.silent) {
							console.error(I)
							break
						}
						throw new Error(I)
					}
				} else (Z = Z.substring(m.raw.length)), b.push(m)
		return b
	}
}