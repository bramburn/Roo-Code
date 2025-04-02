
const wZ = Hi,
	zm = zl,
	em = Symbol("nomatch"),
	Mi = function (l) {
		const Z = Object.create(null),
			b = Object.create(null),
			m = []
		let G = !0
		const c = "Could not find the language '{}', did you forget to load/include a language module?",
			d = { disableAutodetect: !0, name: "Plain text", contains: [] }
		let W = {
			ignoreUnescapedHTML: !1,
			throwUnescapedHTML: !1,
			noHighlightRe: /^(no-?highlight)$/i,
			languageDetectRe: /\blang(?:uage)?-([\w-]+)\b/i,
			classPrefix: "hljs-",
			cssSelector: "pre code",
			languages: null,
			__emitter: hg,
		}
		function V(a) {
			return W.noHighlightRe.test(a)
		}
		function X(a, n, N) {
			let C = "",
				T = ""
			typeof n == "object"
				? ((C = a), (N = n.ignoreIllegals), (T = n.language))
				: (Al("10.7.0", "highlight(lang, code, ...args) has been deprecated."),
					Al(
						"10.7.0",
						`Please use highlight(code, options) instead.
https://github.com/highlightjs/highlight.js/issues/2277`,
					),
					(T = a),
					(C = n)),
				N === void 0 && (N = !0)
			const L = { code: C, language: T }
			y("before:highlight", L)
			const U = L.result ? L.result : I(L.language, L.code, N)
			return (U.code = L.code), y("after:highlight", U), U
		}
		function I(a, n, N, C) {
			const T = Object.create(null)
			function L() {
				if (!e.keywords) return void dl.addText(P)
				let t = 0
				e.keywordPatternRe.lastIndex = 0
				let w = e.keywordPatternRe.exec(P),
					Zl = ""
				for (; w; ) {
					Zl += P.substring(t, w.index)
					const ml = Vl.case_insensitive ? w[0].toLowerCase() : w[0],
						Rl = ((ll = ml), e.keywords[ll])
					if (Rl) {
						const [Jl, ql] = Rl
						if (
							(dl.addText(Zl),
							(Zl = ""),
							(T[ml] = (T[ml] || 0) + 1),
							T[ml] <= 7 && (nl += ql),
							Jl.startsWith("_"))
						)
							Zl += w[0]
						else {
							const Ml = Vl.classNameAliases[Jl] || Jl
							M(w[0], Ml)
						}
					} else Zl += w[0]
					;(t = e.keywordPatternRe.lastIndex), (w = e.keywordPatternRe.exec(P))
				}
				var ll
				;(Zl += P.substring(t)), dl.addText(Zl)
			}
			function U() {
				e.subLanguage != null
					? (function () {
							if (P === "") return
							let t = null
							if (typeof e.subLanguage == "string") {
								if (!Z[e.subLanguage]) return void dl.addText(P)
								;(t = I(e.subLanguage, P, !0, Nl[e.subLanguage])), (Nl[e.subLanguage] = t._top)
							} else t = i(P, e.subLanguage.length ? e.subLanguage : null)
							e.relevance > 0 && (nl += t.relevance), dl.__addSublanguage(t._emitter, t.language)
						})()
					: L(),
					(P = "")
			}
			function M(t, w) {
				t !== "" && (dl.startScope(w), dl.addText(t), dl.endScope())
			}
			function Q(t, w) {
				let Zl = 1
				const ll = w.length - 1
				for (; Zl <= ll; ) {
					if (!t._emit[Zl]) {
						Zl++
						continue
					}
					const ml = Vl.classNameAliases[t[Zl]] || t[Zl],
						Rl = w[Zl]
					ml ? M(Rl, ml) : ((P = Rl), L(), (P = "")), Zl++
				}
			}
			function r(t, w) {
				return (
					t.scope && typeof t.scope == "string" && dl.openNode(Vl.classNameAliases[t.scope] || t.scope),
					t.beginScope &&
						(t.beginScope._wrap
							? (M(P, Vl.classNameAliases[t.beginScope._wrap] || t.beginScope._wrap), (P = ""))
							: t.beginScope._multi && (Q(t.beginScope, w), (P = ""))),
					(e = Object.create(t, { parent: { value: e } })),
					e
				)
			}
			function v(t, w, Zl) {
				let ll = (function (ml, Rl) {
					const Jl = ml && ml.exec(Rl)
					return Jl && Jl.index === 0
				})(t.endRe, Zl)
				if (ll) {
					if (t["on:end"]) {
						const ml = new Lm(t)
						t["on:end"](w, ml), ml.isMatchIgnored && (ll = !1)
					}
					if (ll) {
						for (; t.endsParent && t.parent; ) t = t.parent
						return t
					}
				}
				if (t.endsWithParent) return v(t.parent, w, Zl)
			}
			function _(t) {
				return e.matcher.regexIndex === 0 ? ((P += t[0]), 1) : ((Ul = !0), 0)
			}
			function Wl(t) {
				const w = t[0],
					Zl = n.substring(t.index),
					ll = v(e, t, Zl)
				if (!ll) return em
				const ml = e
				e.endScope && e.endScope._wrap
					? (U(), M(w, e.endScope._wrap))
					: e.endScope && e.endScope._multi
						? (U(), Q(e.endScope, t))
						: ml.skip
							? (P += w)
							: (ml.returnEnd || ml.excludeEnd || (P += w), U(), ml.excludeEnd && (P = w))
				do e.scope && dl.closeNode(), e.skip || e.subLanguage || (nl += e.relevance), (e = e.parent)
				while (e !== ll.parent)
				return ll.starts && r(ll.starts, t), ml.returnEnd ? 0 : w.length
			}
			let Yl = {}
			function gl(t, w) {
				const Zl = w && w[0]
				if (((P += t), Zl == null)) return U(), 0
				if (Yl.type === "begin" && w.type === "end" && Yl.index === w.index && Zl === "") {
					if (((P += n.slice(w.index, w.index + 1)), !G)) {
						const ll = new Error(`0 width match regex (${a})`)
						throw ((ll.languageName = a), (ll.badRule = Yl.rule), ll)
					}
					return 1
				}
				if (((Yl = w), w.type === "begin"))
					return (function (ll) {
						const ml = ll[0],
							Rl = ll.rule,
							Jl = new Lm(Rl),
							ql = [Rl.__beforeBegin, Rl["on:begin"]]
						for (const Ml of ql) if (Ml && (Ml(ll, Jl), Jl.isMatchIgnored)) return _(ml)
						return (
							Rl.skip
								? (P += ml)
								: (Rl.excludeBegin && (P += ml), U(), Rl.returnBegin || Rl.excludeBegin || (P = ml)),
							r(Rl, ll),
							Rl.returnBegin ? 0 : ml.length
						)
					})(w)
				if (w.type === "illegal" && !N) {
					const ll = new Error('Illegal lexeme "' + Zl + '" for mode "' + (e.scope || "<unnamed>") + '"')
					throw ((ll.mode = e), ll)
				}
				if (w.type === "end") {
					const ll = Wl(w)
					if (ll !== em) return ll
				}
				if (w.type === "illegal" && Zl === "") return 1
				if (ol > 1e5 && ol > 3 * w.index)
					throw new Error("potential infinite loop, way more iterations than matches")
				return (P += Zl), Zl.length
			}
			const Vl = u(a)
			if (!Vl) throw (El(c.replace("{}", a)), new Error('Unknown language: "' + a + '"'))
			const xl = Dg(Vl)
			let Hl = "",
				e = C || xl
			const Nl = {},
				dl = new W.__emitter(W)
			;(function () {
				const t = []
				for (let w = e; w !== Vl; w = w.parent) w.scope && t.unshift(w.scope)
				t.forEach((w) => dl.openNode(w))
			})()
			let P = "",
				nl = 0,
				al = 0,
				ol = 0,
				Ul = !1
			try {
				if (Vl.__emitTokens) Vl.__emitTokens(n, dl)
				else {
					for (e.matcher.considerAll(); ; ) {
						ol++, Ul ? (Ul = !1) : e.matcher.considerAll(), (e.matcher.lastIndex = al)
						const t = e.matcher.exec(n)
						if (!t) break
						const w = gl(n.substring(al, t.index), t)
						al = t.index + w
					}
					gl(n.substring(al))
				}
				return (
					dl.finalize(),
					(Hl = dl.toHTML()),
					{ language: a, value: Hl, relevance: nl, illegal: !1, _emitter: dl, _top: e }
				)
			} catch (t) {
				if (t.message && t.message.includes("Illegal"))
					return {
						language: a,
						value: wZ(n),
						illegal: !0,
						relevance: 0,
						_illegalBy: {
							message: t.message,
							index: al,
							context: n.slice(al - 100, al + 100),
							mode: t.mode,
							resultSoFar: Hl,
						},
						_emitter: dl,
					}
				if (G)
					return {
						language: a,
						value: wZ(n),
						illegal: !1,
						relevance: 0,
						errorRaised: t,
						_emitter: dl,
						_top: e,
					}
				throw t
			}
		}
		function i(a, n) {
			n = n || W.languages || Object.keys(Z)
			const N = (function (Q) {
					const r = { value: wZ(Q), illegal: !1, relevance: 0, _top: d, _emitter: new W.__emitter(W) }
					return r._emitter.addText(Q), r
				})(a),
				C = n
					.filter(u)
					.filter(h)
					.map((Q) => I(Q, a, !1))
			C.unshift(N)
			const T = C.sort((Q, r) => {
					if (Q.relevance !== r.relevance) return r.relevance - Q.relevance
					if (Q.language && r.language) {
						if (u(Q.language).supersetOf === r.language) return 1
						if (u(r.language).supersetOf === Q.language) return -1
					}
					return 0
				}),
				[L, U] = T,
				M = L
			return (M.secondBest = U), M
		}
		function g(a) {
			let n = null
			const N = (function (L) {
				let U = L.className + " "
				U += L.parentNode ? L.parentNode.className : ""
				const M = W.languageDetectRe.exec(U)
				if (M) {
					const Q = u(M[1])
					return (
						Q || (Km(c.replace("{}", M[1])), Km("Falling back to no-highlight mode for this block.", L)),
						Q ? M[1] : "no-highlight"
					)
				}
				return U.split(/\s+/).find((Q) => V(Q) || u(Q))
			})(a)
			if (V(N)) return
			if ((y("before:highlightElement", { el: a, language: N }), a.dataset.highlighted))
				return void console.log(
					"Element previously highlighted. To highlight again, first unset `dataset.highlighted`.",
					a,
				)
			if (
				a.children.length > 0 &&
				(W.ignoreUnescapedHTML ||
					(console.warn(
						"One of your code blocks includes unescaped HTML. This is a potentially serious security risk.",
					),
					console.warn("https://github.com/highlightjs/highlight.js/wiki/security"),
					console.warn("The element with unescaped HTML:"),
					console.warn(a)),
				W.throwUnescapedHTML)
			)
				throw new Ag("One of your code blocks includes unescaped HTML.", a.innerHTML)
			n = a
			const C = n.textContent,
				T = N ? X(C, { language: N, ignoreIllegals: !0 }) : i(C)
			;(a.innerHTML = T.value),
				(a.dataset.highlighted = "yes"),
				(function (L, U, M) {
					const Q = (U && b[U]) || M
					L.classList.add("hljs"), L.classList.add(`language-${Q}`)
				})(a, N, T.language),
				(a.result = { language: T.language, re: T.relevance, relevance: T.relevance }),
				T.secondBest && (a.secondBest = { language: T.secondBest.language, relevance: T.secondBest.relevance }),
				y("after:highlightElement", { el: a, result: T, text: C })
		}
		let R = !1
		function Y() {
			if (document.readyState === "loading") return void (R = !0)
			document.querySelectorAll(W.cssSelector).forEach(g)
		}
		function u(a) {
			return (a = (a || "").toLowerCase()), Z[a] || Z[b[a]]
		}
		function p(a, { languageName: n }) {
			typeof a == "string" && (a = [a]),
				a.forEach((N) => {
					b[N.toLowerCase()] = n
				})
		}
		function h(a) {
			const n = u(a)
			return n && !n.disableAutodetect
		}
		function y(a, n) {
			const N = a
			m.forEach(function (C) {
				C[N] && C[N](n)
			})
		}
		typeof window < "u" &&
			window.addEventListener &&
			window.addEventListener(
				"DOMContentLoaded",
				function () {
					R && Y()
				},
				!1,
			),
			Object.assign(l, {
				highlight: X,
				highlightAuto: i,
				highlightAll: Y,
				highlightElement: g,
				highlightBlock: function (a) {
					return (
						Al("10.7.0", "highlightBlock will be removed entirely in v12.0"),
						Al("10.7.0", "Please use highlightElement now."),
						g(a)
					)
				},
				configure: function (a) {
					W = zm(W, a)
				},
				initHighlighting: () => {
					Y(), Al("10.6.0", "initHighlighting() deprecated.  Use highlightAll() now.")
				},
				initHighlightingOnLoad: function () {
					Y(), Al("10.6.0", "initHighlightingOnLoad() deprecated.  Use highlightAll() now.")
				},
				registerLanguage: function (a, n) {
					let N = null
					try {
						N = n(l)
					} catch (C) {
						if ((El("Language definition for '{}' could not be registered.".replace("{}", a)), !G)) throw C
						El(C), (N = d)
					}
					N.name || (N.name = a),
						(Z[a] = N),
						(N.rawDefinition = n.bind(null, l)),
						N.aliases && p(N.aliases, { languageName: a })
				},
				unregisterLanguage: function (a) {
					delete Z[a]
					for (const n of Object.keys(b)) b[n] === a && delete b[n]
				},
				listLanguages: function () {
					return Object.keys(Z)
				},
				getLanguage: u,
				registerAliases: p,
				autoDetection: h,
				inherit: zm,
				addPlugin: function (a) {
					;(function (n) {
						n["before:highlightBlock"] &&
							!n["before:highlightElement"] &&
							(n["before:highlightElement"] = (N) => {
								n["before:highlightBlock"](Object.assign({ block: N.el }, N))
							}),
							n["after:highlightBlock"] &&
								!n["after:highlightElement"] &&
								(n["after:highlightElement"] = (N) => {
									n["after:highlightBlock"](Object.assign({ block: N.el }, N))
								})
					})(a),
						m.push(a)
				},
				removePlugin: function (a) {
					const n = m.indexOf(a)
					n !== -1 && m.splice(n, 1)
				},
			}),
			(l.debugMode = function () {
				G = !1
			}),
			(l.safeMode = function () {
				G = !0
			}),
			(l.versionString = "11.9.0"),
			(l.regex = { concat: Dl, lookahead: Li, either: nb, optional: Ng, anyNumberOfTimes: sg })
		for (const a in pZ) typeof pZ[a] == "object" && xi(pZ[a])
		return Object.assign(l, pZ), l
	},
	fl = Mi({})