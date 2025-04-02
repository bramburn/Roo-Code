
				const Q = [].concat(U, n.contains),
					r = Q.concat([{ begin: /\(/, end: /\)/, keywords: u, contains: ["self"].concat(Q) }]),
					v = {
						className: "params",
						begin: /\(/,
						end: /\)/,
						excludeBegin: !0,
						excludeEnd: !0,
						keywords: u,
						contains: r,
					},
					_ = {
						variants: [
							{
								match: [
									/class/,
									/\s+/,
									i,
									/\s+/,
									/extends/,
									/\s+/,
									I.concat(i, "(", I.concat(/\./, i), ")*"),
								],
								scope: { 1: "keyword", 3: "title.class", 5: "keyword", 7: "title.class.inherited" },
							},
							{ match: [/class/, /\s+/, i], scope: { 1: "keyword", 3: "title.class" } },
						],
					},
					Wl = {
						relevance: 0,
						match: I.either(
							/\bJSON/,
							/\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,
							/\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,
							/\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/,
						),
						className: "title.class",
						keywords: { _: [...m, ...G] },
					},
					Yl = {
						variants: [
							{ match: [/function/, /\s+/, i, /(?=\s*\()/] },
							{ match: [/function/, /\s*(?=\()/] },
						],
						className: { 1: "keyword", 3: "title.function" },
						label: "func.def",
						contains: [v],
						illegal: /%/,
					},
					gl = {
						match: I.concat(
							/\b/,
							(function (Nl) {
								return I.concat("(?!", Nl.join("|"), ")")
							})([...c, "super", "import"]),
							i,
							I.lookahead(/\(/),
						),
						className: "title.function",
						relevance: 0,
					},
					Vl = {
						begin: I.concat(/\./, I.lookahead(I.concat(i, /(?![0-9A-Za-z$_(])/))),
						end: i,
						excludeBegin: !0,
						keywords: "prototype",
						className: "property",
						relevance: 0,
					},
					xl = {
						match: [/get|set/, /\s+/, i, /(?=\()/],
						className: { 1: "keyword", 3: "title.function" },
						contains: [{ begin: /\(\)/ }, v],
					},
					Hl = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + X.UNDERSCORE_IDENT_RE + ")\\s*=>",
					e = {
						match: [/const|var|let/, /\s+/, i, /\s*/, /=\s*/, /(async\s*)?/, I.lookahead(Hl)],
						keywords: "async",
						className: { 1: "keyword", 3: "title.function" },
						contains: [v],
					}