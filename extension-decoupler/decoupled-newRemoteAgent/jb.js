
const Ui = "[a-zA-Z]\\w*",
	Jb = "[a-zA-Z_]\\w*",
	ti = "\\b\\d+(\\.\\d+)?",
	Ki = "(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)",
	ki = "\\b(0b[01]+)",
	dZ = { begin: "\\\\[\\s\\S]", relevance: 0 },
	Jg = { scope: "string", begin: "'", end: "'", illegal: "\\n", contains: [dZ] },
	og = { scope: "string", begin: '"', end: '"', illegal: "\\n", contains: [dZ] },
	TZ = function (l, Z, b = {}) {
		const m = zl({ scope: "comment", begin: l, end: Z, contains: [] }, b)
		m.contains.push({
			scope: "doctag",
			begin: "[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",
			end: /(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,
			excludeBegin: !0,
			relevance: 0,
		})
		const G = nb(
			"I",
			"a",
			"is",
			"so",
			"us",
			"to",
			"at",
			"if",
			"in",
			"it",
			"on",
			/[A-Za-z]+['](d|ve|re|ll|t|s|n)/,
			/[A-Za-z]+[-][a-z]+/,
			/[A-Za-z][a-z]{2,}/,
		)
		return m.contains.push({ begin: Dl(/[ ]+/, "(", G, /[.]?[:]?([.][ ]|[ ])/, "){3}") }), m
	},
	Cg = TZ("//", "$"),
	Bg = TZ("/\\*", "\\*/"),
	Fg = TZ("#", "$"),
	Sg = { scope: "number", begin: ti, relevance: 0 },
	xg = { scope: "number", begin: Ki, relevance: 0 },
	Hg = { scope: "number", begin: ki, relevance: 0 },
	Lg = {
		scope: "regexp",
		begin: /\/(?=[^/\n]*\/)/,
		end: /\/[gimuy]*/,
		contains: [dZ, { begin: /\[/, end: /\]/, relevance: 0, contains: [dZ] }],
	},
	Tg = { scope: "title", begin: Ui, relevance: 0 },
	Ug = { scope: "title", begin: Jb, relevance: 0 },
	tg = { begin: "\\.\\s*" + Jb, relevance: 0 }