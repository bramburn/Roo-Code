
					const T = { match: /\s+/, relevance: 0 },
						L = C.COMMENT("/\\*", "\\*/", { contains: ["self"] }),
						U = [C.C_LINE_COMMENT_MODE, L],
						M = { match: [/\./, m(...c, ...d)], className: { 2: "keyword" } },
						Q = { match: b(/\./, m(...V)), relevance: 0 },
						r = V.filter((Xl) => typeof Xl == "string").concat(["_|0"]),
						v = {
							variants: [
								{
									className: "keyword",
									match: m(
										...V.filter((Xl) => typeof Xl != "string")
											.concat(W)
											.map(G),
										...d,
									),
								},
							],
						},
						_ = { $pattern: m(/\b\w+/, /#\w+/), keyword: r.concat(i), literal: X },
						Wl = [M, Q, v],
						Yl = [
							{ match: b(/\./, m(...g)), relevance: 0 },
							{ className: "built_in", match: b(/\b/, m(...g), /(?=\()/) },
						],
						gl = { match: /->/, relevance: 0 },
						Vl = [
							gl,
							{
								className: "operator",
								relevance: 0,
								variants: [{ match: u }, { match: `\\.(\\.|${Y})+` }],
							},
						],
						xl = "([0-9]_*)+",
						Hl = "([0-9a-fA-F]_*)+",
						e = {
							className: "number",
							relevance: 0,
							variants: [
								{ match: `\\b(${xl})(\\.(${xl}))?([eE][+-]?(${xl}))?\\b` },
								{ match: `\\b0x(${Hl})(\\.(${Hl}))?([pP][+-]?(${xl}))?\\b` },
								{ match: /\b0o([0-7]_*)+\b/ },
								{ match: /\b0b([01]_*)+\b/ },
							],
						},
						Nl = (Xl = "") => ({
							className: "subst",
							variants: [
								{ match: b(/\\/, Xl, /[0\\tnr"']/) },
								{ match: b(/\\/, Xl, /u\{[0-9a-fA-F]{1,8}\}/) },
							],
						}),
						dl = (Xl = "") => ({ className: "subst", match: b(/\\/, Xl, /[\t ]*(?:[\r\n]|\r\n)/) }),
						P = (Xl = "") => ({
							className: "subst",
							label: "interpol",
							begin: b(/\\/, Xl, /\(/),
							end: /\)/,
						}),
						nl = (Xl = "") => ({
							begin: b(Xl, /"""/),
							end: b(/"""/, Xl),
							contains: [Nl(Xl), dl(Xl), P(Xl)],
						}),
						al = (Xl = "") => ({ begin: b(Xl, /"/), end: b(/"/, Xl), contains: [Nl(Xl), P(Xl)] }),
						ol = {
							className: "string",
							variants: [nl(), nl("#"), nl("##"), nl("###"), al(), al("#"), al("##"), al("###")],
						},
						Ul = [
							C.BACKSLASH_ESCAPE,
							{ begin: /\[/, end: /\]/, relevance: 0, contains: [C.BACKSLASH_ESCAPE] },
						],
						t = { begin: /\/[^\s](?=[^/\n]*\/)/, end: /\//, contains: Ul },
						w = (Xl) => {
							const IZ = b(Xl, /\//),
								$l = b(/\//, Xl)
							return {
								begin: IZ,
								end: $l,
								contains: [...Ul, { scope: "comment", begin: `#(?!.*${$l})`, end: /$/ }],
							}
						},
						Zl = { scope: "regexp", variants: [w("###"), w("##"), w("#"), t] },
						ll = { match: b(/`/, y, /`/) },
						ml = [
							ll,
							{ className: "variable", match: /\$\d+/ },
							{ className: "variable", match: `\\$${h}+` },
						],
						Rl = [
							{
								match: /(@|#(un)?)available/,
								scope: "keyword",
								starts: {
									contains: [{ begin: /\(/, end: /\)/, keywords: N, contains: [...Vl, e, ol] }],
								},
							},
							{ scope: "keyword", match: b(/@/, m(...n)) },
							{ scope: "meta", match: b(/@/, y) },
						],
						Jl = {
							match: Z(/\b[A-Z]/),
							relevance: 0,
							contains: [
								{
									className: "type",
									match: b(/(AV|CA|CF|CG|CI|CL|CM|CN|CT|MK|MP|MTK|MTL|NS|SCN|SK|UI|WK|XC)/, h, "+"),
								},
								{ className: "type", match: a, relevance: 0 },
								{ match: /[?!]+/, relevance: 0 },
								{ match: /\.\.\./, relevance: 0 },
								{ match: b(/\s+&\s+/, Z(a)), relevance: 0 },
							],
						},
						ql = { begin: /</, end: />/, keywords: _, contains: [...U, ...Wl, ...Rl, gl, Jl] }