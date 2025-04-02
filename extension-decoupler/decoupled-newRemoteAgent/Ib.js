
function Ib(l, { joinWith: Z }) {
	let b = 0
	return l
		.map((m) => {
			b += 1
			const G = b
			let c = cZ(m),
				d = ""
			for (; c.length > 0; ) {
				const W = ng.exec(c)
				if (!W) {
					d += c
					break
				}
				;(d += c.substring(0, W.index)),
					(c = c.substring(W.index + W[0].length)),
					W[0][0] === "\\" && W[1]
						? (d += "\\" + String(Number(W[1]) + G))
						: ((d += W[0]), W[0] === "(" && b++)
			}
			return d
		})
		.map((m) => `(${m})`)
		.join(Z)
}