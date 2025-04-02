import {
	S as $t,
	i as mt,
	s as ut,
	B as k,
	c as B,
	d as v,
	e as E,
	l as U,
	t as h,
	m as j,
	o as g,
	f as y,
	V as X,
	a1 as dt,
	a2 as pt,
	R as J,
	u as R,
	C as N,
	v as C,
	w as L,
	X as W,
	Y as K,
	n as O,
	O as q,
	P as Y,
	Q as V,
} from "./index-Cxp-oF9W.js"
import { V as ht } from "./VSCodeTextArea-DGwd0WYt.js"
import { B as Z } from "./ButtonAugment-Dln4ROF_.js"
import { C as et } from "./CalloutAugment-BIcZz6S6.js"
import { G as gt, R as vt } from "./remote-agent-manager-ufpvcZYs.js"
import { e as ct, u as yt, o as wt } from "./_commonjsHelpers-BM1RAGEf.js"
import { D as H, T as _t } from "./index-Bk2-febx.js"
import { T as nt, S as bt } from "./SpinnerAugment-CWz_wHIa.js"
import { R as rt } from "./reload-BMVVSWVl.js"
import { a as xt, T as kt } from "./CardAugment-xKUVniT5.js"
import { R as Rt } from "./RemoteAgentHeader-jRmp2PPt.js"
import "./IconButtonAugment-CKx753hG.js"
import "./design-system-init-54NLVxEt.js"
import "./design-system-init-8inpW8J7.js"
import "./host-D8UFmYQJ.js"
import "./message-broker-PQB224Bk.js"
import "./async-messaging-3bHu_1HR.js"
import "./preload-helper-Dv6uf1Os.js"
import "./await_block-DGpm6F4k.js"
import "./types-CX2taqic.js"
import "./chat-types-C4hXHCYx.js"
import "./chat-message-BRQbnzso.js"
import "./tool-use-state-COveilVZ.js"
import "./globals-D0QH3NT1.js"
import "./clipboard-copy-u1Jo32GD.js"
import "./SuccessfulButton-DuDFoOel.js"
function st(c, e, t) {
	const n = c.slice()
	return (n[31] = e[t]), n
}
function Ct(c) {
	let e, t, n, r
	const o = [Et, Bt],
		s = []
	function i(a, l) {
		return a[0] ? (a[0] ? 1 : -1) : 0
	}
	return (
		~(e = i(c)) && (t = s[e] = o[e](c)),
		{
			c() {
				t && t.c(), (n = J())
			},
			m(a, l) {
				~e && s[e].m(a, l), v(a, n, l), (r = !0)
			},
			p(a, l) {
				let m = e
				;(e = i(a)),
					e === m
						? ~e && s[e].p(a, l)
						: (t &&
								(U(),
								h(s[m], 1, 1, () => {
									s[m] = null
								}),
								j()),
							~e
								? ((t = s[e]),
									t ? t.p(a, l) : ((t = s[e] = o[e](a)), t.c()),
									g(t, 1),
									t.m(n.parentNode, n))
								: (t = null))
			},
			i(a) {
				r || (g(t), (r = !0))
			},
			o(a) {
				h(t), (r = !1)
			},
			d(a) {
				a && y(n), ~e && s[e].d(a)
			},
		}
	)
}
function Lt(c) {
	let e, t, n, r, o
	return (
		(t = new nt({ props: { size: 2, $$slots: { default: [ee] }, $$scope: { ctx: c } } })),
		(r = new bt({ props: { size: 2 } })),
		{
			c() {
				;(e = k("div")),
					R(t.$$.fragment),
					(n = N()),
					R(r.$$.fragment),
					B(e, "class", "c-commit-ref-selector__loading")
			},
			m(s, i) {
				v(s, e, i), C(t, e, null), E(e, n), C(r, e, null), (o = !0)
			},
			p(s, i) {
				const a = {}
				8 & i[1] && (a.$$scope = { dirty: i, ctx: s }), t.$set(a)
			},
			i(s) {
				o || (g(t.$$.fragment, s), g(r.$$.fragment, s), (o = !0))
			},
			o(s) {
				h(t.$$.fragment, s), h(r.$$.fragment, s), (o = !1)
			},
			d(s) {
				s && y(e), L(t), L(r)
			},
		}
	)
}
function Bt(c) {
	let e, t, n
	return (
		(t = new et({
			props: { color: "warning", variant: "soft", size: 2, $$slots: { default: [It] }, $$scope: { ctx: c } },
		})),
		{
			c() {
				;(e = k("div")), R(t.$$.fragment), B(e, "class", "c-commit-ref-selector__error svelte-n99er0")
			},
			m(r, o) {
				v(r, e, o), C(t, e, null), (n = !0)
			},
			p(r, o) {
				const s = {}
				;(130 & o[0]) | (8 & o[1]) && (s.$$scope = { dirty: o, ctx: r }), t.$set(s)
			},
			i(r) {
				n || (g(t.$$.fragment, r), (n = !0))
			},
			o(r) {
				h(t.$$.fragment, r), (n = !1)
			},
			d(r) {
				r && y(e), L(t)
			},
		}
	)
}
function Et(c) {
	let e, t, n, r, o, s, i, a
	return (
		(n = new nt({ props: { size: 2, $$slots: { default: [Nt] }, $$scope: { ctx: c } } })),
		(o = new H.Root({ props: { onOpenChange: c[16], $$slots: { default: [Jt] }, $$scope: { ctx: c } } })),
		(i = new Z({
			props: {
				variant: "outline",
				color: "neutral",
				size: 1,
				loading: c[1],
				title: "Run 'git fetch' to update remote branches",
				$$slots: { iconLeft: [te], default: [Zt] },
				$$scope: { ctx: c },
			},
		})),
		i.$on("click", c[12]),
		{
			c() {
				;(e = k("div")),
					(t = k("div")),
					R(n.$$.fragment),
					(r = N()),
					R(o.$$.fragment),
					(s = N()),
					R(i.$$.fragment),
					B(t, "class", "c-commit-ref-selector__branch-line svelte-n99er0"),
					B(e, "class", "c-commit-ref-selector__branch-line-container svelte-n99er0")
			},
			m(l, m) {
				v(l, e, m), E(e, t), C(n, t, null), E(t, r), C(o, t, null), E(e, s), C(i, e, null), (a = !0)
			},
			p(l, m) {
				const p = {}
				8 & m[1] && (p.$$scope = { dirty: m, ctx: l }), n.$set(p)
				const _ = {}
				;(892 & m[0]) | (8 & m[1]) && (_.$$scope = { dirty: m, ctx: l }), o.$set(_)
				const d = {}
				2 & m[0] && (d.loading = l[1]), 8 & m[1] && (d.$$scope = { dirty: m, ctx: l }), i.$set(d)
			},
			i(l) {
				a || (g(n.$$.fragment, l), g(o.$$.fragment, l), g(i.$$.fragment, l), (a = !0))
			},
			o(l) {
				h(n.$$.fragment, l), h(o.$$.fragment, l), h(i.$$.fragment, l), (a = !1)
			},
			d(l) {
				l && y(e), L(n), L(o), L(i)
			},
		}
	)
}
function St(c) {
	let e, t
	return (
		(e = new Z({
			props: {
				variant: "outline",
				color: "warning",
				size: 1,
				loading: c[1],
				class: "c-commit-ref-selector__fetch-button",
				title: "Run 'git fetch' to update remote branches",
				$$slots: { iconLeft: [At], default: [zt] },
				$$scope: { ctx: c },
			},
		})),
		e.$on("click", c[12]),
		{
			c() {
				R(e.$$.fragment)
			},
			m(n, r) {
				C(e, n, r), (t = !0)
			},
			p(n, r) {
				const o = {}
				2 & r[0] && (o.loading = n[1]), 8 & r[1] && (o.$$scope = { dirty: r, ctx: n }), e.$set(o)
			},
			i(n) {
				t || (g(e.$$.fragment, n), (t = !0))
			},
			o(n) {
				h(e.$$.fragment, n), (t = !1)
			},
			d(n) {
				L(e, n)
			},
		}
	)
}
function Tt(c) {
	let e, t
	return (
		(e = new Z({
			props: {
				variant: "outline",
				color: "warning",
				size: 1,
				loading: c[1],
				$$slots: { iconLeft: [Ft], default: [Dt] },
				$$scope: { ctx: c },
			},
		})),
		e.$on("click", c[11]),
		{
			c() {
				R(e.$$.fragment)
			},
			m(n, r) {
				C(e, n, r), (t = !0)
			},
			p(n, r) {
				const o = {}
				2 & r[0] && (o.loading = n[1]), 8 & r[1] && (o.$$scope = { dirty: r, ctx: n }), e.$set(o)
			},
			i(n) {
				t || (g(e.$$.fragment, n), (t = !0))
			},
			o(n) {
				h(e.$$.fragment, n), (t = !1)
			},
			d(n) {
				L(e, n)
			},
		}
	)
}
function zt(c) {
	let e
	return {
		c() {
			e = W("Run git fetch to refresh branches")
		},
		m(t, n) {
			v(t, e, n)
		},
		d(t) {
			t && y(e)
		},
	}
}
function At(c) {
	let e, t, n
	return (
		(t = new rt({})),
		{
			c() {
				;(e = k("span")), R(t.$$.fragment), B(e, "slot", "iconLeft")
			},
			m(r, o) {
				v(r, e, o), C(t, e, null), (n = !0)
			},
			p: O,
			i(r) {
				n || (g(t.$$.fragment, r), (n = !0))
			},
			o(r) {
				h(t.$$.fragment, r), (n = !1)
			},
			d(r) {
				r && y(e), L(t)
			},
		}
	)
}
function Dt(c) {
	let e
	return {
		c() {
			e = W("Reload")
		},
		m(t, n) {
			v(t, e, n)
		},
		d(t) {
			t && y(e)
		},
	}
}
function Ft(c) {
	let e, t, n
	return (
		(t = new rt({})),
		{
			c() {
				;(e = k("span")), R(t.$$.fragment), B(e, "slot", "iconLeft")
			},
			m(r, o) {
				v(r, e, o), C(t, e, null), (n = !0)
			},
			p: O,
			i(r) {
				n || (g(t.$$.fragment, r), (n = !0))
			},
			o(r) {
				h(t.$$.fragment, r), (n = !1)
			},
			d(r) {
				r && y(e), L(t)
			},
		}
	)
}
function It(c) {
	let e, t, n, r, o, s, i
	const a = [Tt, St],
		l = []
	function m(p, _) {
		return p[7] === p[10].notAGitRepository ? 0 : 1
	}
	return (
		(o = m(c)),
		(s = l[o] = a[o](c)),
		{
			c() {
				;(e = k("div")),
					(t = k("div")),
					(n = W(c[7])),
					(r = N()),
					s.c(),
					B(t, "class", "c-commit-ref-selector__error-message svelte-n99er0"),
					B(e, "class", "c-commit-ref-selector__error-content svelte-n99er0")
			},
			m(p, _) {
				v(p, e, _), E(e, t), E(t, n), E(e, r), l[o].m(e, null), (i = !0)
			},
			p(p, _) {
				;(!i || 128 & _[0]) && K(n, p[7])
				let d = o
				;(o = m(p)),
					o === d
						? l[o].p(p, _)
						: (U(),
							h(l[d], 1, 1, () => {
								l[d] = null
							}),
							j(),
							(s = l[o]),
							s ? s.p(p, _) : ((s = l[o] = a[o](p)), s.c()),
							g(s, 1),
							s.m(e, null))
			},
			i(p) {
				i || (g(s), (i = !0))
			},
			o(p) {
				h(s), (i = !1)
			},
			d(p) {
				p && y(e), l[o].d()
			},
		}
	)
}
function Nt(c) {
	let e
	return {
		c() {
			e = W("Remote agent workspace:")
		},
		m(t, n) {
			v(t, e, n)
		},
		d(t) {
			t && y(e)
		},
	}
}
function Pt(c) {
	var n
	let e,
		t = (((n = c[3]) == null ? void 0 : n.name.replace("origin/", "")) || "Select a branch") + ""
	return {
		c() {
			e = W(t)
		},
		m(r, o) {
			v(r, e, o)
		},
		p(r, o) {
			var s
			8 & o[0] &&
				t !== (t = (((s = r[3]) == null ? void 0 : s.name.replace("origin/", "")) || "Select a branch") + "") &&
				K(e, t)
		},
		d(r) {
			r && y(e)
		},
	}
}
function Mt(c) {
	let e
	return {
		c() {
			e = W("Current Workspace")
		},
		m(t, n) {
			v(t, e, n)
		},
		p: O,
		d(t) {
			t && y(e)
		},
	}
}
function Gt(c) {
	let e
	function t(o, s) {
		return o[6] ? Mt : Pt
	}
	let n = t(c),
		r = n(c)
	return {
		c() {
			;(e = k("strong")), r.c()
		},
		m(o, s) {
			v(o, e, s), r.m(e, null)
		},
		p(o, s) {
			n === (n = t(o)) && r ? r.p(o, s) : (r.d(1), (r = n(o)), r && (r.c(), r.m(e, null)))
		},
		d(o) {
			o && y(e), r.d()
		},
	}
}
function Wt(c) {
	let e, t, n
	return (
		(t = new nt({ props: { size: 2, $$slots: { default: [Gt] }, $$scope: { ctx: c } } })),
		{
			c() {
				;(e = k("span")), R(t.$$.fragment), B(e, "class", "c-commit-ref-selector__branch-trigger svelte-n99er0")
			},
			m(r, o) {
				v(r, e, o), C(t, e, null), (n = !0)
			},
			p(r, o) {
				const s = {}
				;(72 & o[0]) | (8 & o[1]) && (s.$$scope = { dirty: o, ctx: r }), t.$set(s)
			},
			i(r) {
				n || (g(t.$$.fragment, r), (n = !0))
			},
			o(r) {
				h(t.$$.fragment, r), (n = !1)
			},
			d(r) {
				r && y(e), L(t)
			},
		}
	)
}
function Ot(c) {
	let e
	return {
		c() {
			;(e = k("div")),
				(e.innerHTML =
					'<span class="c-commit-ref-selector__branch-name svelte-n99er0">Current Workspace</span>'),
				B(e, "class", "c-commit-ref-selector__branch-item-content svelte-n99er0")
		},
		m(t, n) {
			v(t, e, n)
		},
		p: O,
		i: O,
		o: O,
		d(t) {
			t && y(e)
		},
	}
}
function Ht(c) {
	let e, t
	return (
		(e = new xt({
			props: {
				side: "right",
				content: re,
				triggerOn: [kt.Hover],
				class: "c-commit-ref-selector__workspace-tooltip",
				$$slots: { default: [Ut] },
				$$scope: { ctx: c },
			},
		})),
		{
			c() {
				R(e.$$.fragment)
			},
			m(n, r) {
				C(e, n, r), (t = !0)
			},
			p(n, r) {
				const o = {}
				8 & r[1] && (o.$$scope = { dirty: r, ctx: n }), e.$set(o)
			},
			i(n) {
				t || (g(e.$$.fragment, n), (t = !0))
			},
			o(n) {
				h(e.$$.fragment, n), (t = !1)
			},
			d(n) {
				L(e, n)
			},
		}
	)
}
function Ut(c) {
	let e
	return {
		c() {
			;(e = k("div")),
				(e.innerHTML =
					'<span class="c-commit-ref-selector__branch-name svelte-n99er0">Current Workspace</span>'),
				B(e, "class", "c-commit-ref-selector__branch-item-content svelte-n99er0")
		},
		m(t, n) {
			v(t, e, n)
		},
		p: O,
		d(t) {
			t && y(e)
		},
	}
}
function jt(c) {
	let e, t, n, r
	const o = [Ht, Ot],
		s = []
	function i(a, l) {
		return a[8] ? 0 : 1
	}
	return (
		(e = i(c)),
		(t = s[e] = o[e](c)),
		{
			c() {
				t.c(), (n = J())
			},
			m(a, l) {
				s[e].m(a, l), v(a, n, l), (r = !0)
			},
			p(a, l) {
				let m = e
				;(e = i(a)),
					e === m
						? s[e].p(a, l)
						: (U(),
							h(s[m], 1, 1, () => {
								s[m] = null
							}),
							j(),
							(t = s[e]),
							t ? t.p(a, l) : ((t = s[e] = o[e](a)), t.c()),
							g(t, 1),
							t.m(n.parentNode, n))
			},
			i(a) {
				r || (g(t), (r = !0))
			},
			o(a) {
				h(t), (r = !1)
			},
			d(a) {
				a && y(n), s[e].d(a)
			},
		}
	)
}
function qt(c) {
	let e
	return {
		c() {
			e = W("Remote Branches")
		},
		m(t, n) {
			v(t, e, n)
		},
		d(t) {
			t && y(e)
		},
	}
}
function Yt(c) {
	let e, t
	return (
		(e = new H.Label({ props: { $$slots: { default: [Kt] }, $$scope: { ctx: c } } })),
		{
			c() {
				R(e.$$.fragment)
			},
			m(n, r) {
				C(e, n, r), (t = !0)
			},
			p(n, r) {
				const o = {}
				8 & r[1] && (o.$$scope = { dirty: r, ctx: n }), e.$set(o)
			},
			i(n) {
				t || (g(e.$$.fragment, n), (t = !0))
			},
			o(n) {
				h(e.$$.fragment, n), (t = !1)
			},
			d(n) {
				L(e, n)
			},
		}
	)
}
function Vt(c) {
	let e,
		t,
		n = [],
		r = new Map(),
		o = ct(c[9])
	const s = (i) => i[31].name
	for (let i = 0; i < o.length; i += 1) {
		let a = st(c, o, i),
			l = s(a)
		r.set(l, (n[i] = at(l, a)))
	}
	return {
		c() {
			for (let i = 0; i < n.length; i += 1) n[i].c()
			e = J()
		},
		m(i, a) {
			for (let l = 0; l < n.length; l += 1) n[l] && n[l].m(i, a)
			v(i, e, a), (t = !0)
		},
		p(i, a) {
			16968 & a[0] && ((o = ct(i[9])), U(), (n = yt(n, a, s, 1, i, o, r, e.parentNode, wt, at, e, st)), j())
		},
		i(i) {
			if (!t) {
				for (let a = 0; a < o.length; a += 1) g(n[a])
				t = !0
			}
		},
		o(i) {
			for (let a = 0; a < n.length; a += 1) h(n[a])
			t = !1
		},
		d(i) {
			i && y(e)
			for (let a = 0; a < n.length; a += 1) n[a].d(i)
		},
	}
}
function Kt(c) {
	let e
	return {
		c() {
			e = W("No branches found")
		},
		m(t, n) {
			v(t, e, n)
		},
		d(t) {
			t && y(e)
		},
	}
}
function Qt(c) {
	let e,
		t,
		n,
		r,
		o = c[31].name.replace("origin/", "") + ""
	return {
		c() {
			;(e = k("div")),
				(t = k("span")),
				(n = W(o)),
				(r = N()),
				B(t, "class", "c-commit-ref-selector__branch-name svelte-n99er0"),
				B(e, "class", "c-commit-ref-selector__branch-item-content svelte-n99er0")
		},
		m(s, i) {
			v(s, e, i), E(e, t), E(t, n), v(s, r, i)
		},
		p(s, i) {
			512 & i[0] && o !== (o = s[31].name.replace("origin/", "") + "") && K(n, o)
		},
		d(s) {
			s && (y(e), y(r))
		},
	}
}
function at(c, e) {
	var s
	let t, n, r
	function o() {
		return e[21](e[31])
	}
	return (
		(n = new H.Item({
			props: {
				onSelect: o,
				highlight: !e[6] && ((s = e[3]) == null ? void 0 : s.name) === e[31].name,
				$$slots: { default: [Qt] },
				$$scope: { ctx: e },
			},
		})),
		{
			key: c,
			first: null,
			c() {
				;(t = J()), R(n.$$.fragment), (this.first = t)
			},
			m(i, a) {
				v(i, t, a), C(n, i, a), (r = !0)
			},
			p(i, a) {
				var m
				e = i
				const l = {}
				512 & a[0] && (l.onSelect = o),
					584 & a[0] && (l.highlight = !e[6] && ((m = e[3]) == null ? void 0 : m.name) === e[31].name),
					(512 & a[0]) | (8 & a[1]) && (l.$$scope = { dirty: a, ctx: e }),
					n.$set(l)
			},
			i(i) {
				r || (g(n.$$.fragment, i), (r = !0))
			},
			o(i) {
				h(n.$$.fragment, i), (r = !1)
			},
			d(i) {
				i && y(t), L(n, i)
			},
		}
	)
}
function Xt(c) {
	let e, t, n, r, o, s, i, a, l, m, p, _, d, x, P
	function G(f) {
		c[17](f)
	}
	function F(f) {
		c[18](f)
	}
	let A = { placeholder: "Search branches", size: 2 }
	c[4] !== void 0 && (A.value = c[4]),
		c[5] !== void 0 && (A.textInput = c[5]),
		(t = new _t({ props: A })),
		q.push(() => Y(t, "value", G)),
		q.push(() => Y(t, "textInput", F)),
		t.$on("input", c[19]),
		(s = new H.Item({
			props: {
				onSelect: c[20],
				class: "c-commit-ref-selector__workspace-option",
				disabled: c[8],
				highlight: c[6],
				$$slots: { default: [jt] },
				$$scope: { ctx: c },
			},
		})),
		(a = new H.Separator({})),
		(m = new H.Label({ props: { $$slots: { default: [qt] }, $$scope: { ctx: c } } }))
	const D = [Vt, Yt],
		T = []
	function I(f, w) {
		return f[2].length > 0 ? 0 : 1
	}
	return (
		(d = I(c)),
		(x = T[d] = D[d](c)),
		{
			c() {
				;(e = k("div")),
					R(t.$$.fragment),
					(o = N()),
					R(s.$$.fragment),
					(i = N()),
					R(a.$$.fragment),
					(l = N()),
					R(m.$$.fragment),
					(p = N()),
					(_ = k("div")),
					x.c(),
					B(e, "class", "c-commit-ref-selector__search-field svelte-n99er0"),
					B(_, "class", "c-commit-ref-selector__branches-container svelte-n99er0")
			},
			m(f, w) {
				v(f, e, w),
					C(t, e, null),
					v(f, o, w),
					C(s, f, w),
					v(f, i, w),
					C(a, f, w),
					v(f, l, w),
					C(m, f, w),
					v(f, p, w),
					v(f, _, w),
					T[d].m(_, null),
					(P = !0)
			},
			p(f, w) {
				const M = {}
				!n && 16 & w[0] && ((n = !0), (M.value = f[4]), V(() => (n = !1))),
					!r && 32 & w[0] && ((r = !0), (M.textInput = f[5]), V(() => (r = !1))),
					t.$set(M)
				const z = {}
				256 & w[0] && (z.onSelect = f[20]),
					256 & w[0] && (z.disabled = f[8]),
					64 & w[0] && (z.highlight = f[6]),
					(256 & w[0]) | (8 & w[1]) && (z.$$scope = { dirty: w, ctx: f }),
					s.$set(z)
				const $ = {}
				8 & w[1] && ($.$$scope = { dirty: w, ctx: f }), m.$set($)
				let b = d
				;(d = I(f)),
					d === b
						? T[d].p(f, w)
						: (U(),
							h(T[b], 1, 1, () => {
								T[b] = null
							}),
							j(),
							(x = T[d]),
							x ? x.p(f, w) : ((x = T[d] = D[d](f)), x.c()),
							g(x, 1),
							x.m(_, null))
			},
			i(f) {
				P ||
					(g(t.$$.fragment, f), g(s.$$.fragment, f), g(a.$$.fragment, f), g(m.$$.fragment, f), g(x), (P = !0))
			},
			o(f) {
				h(t.$$.fragment, f), h(s.$$.fragment, f), h(a.$$.fragment, f), h(m.$$.fragment, f), h(x), (P = !1)
			},
			d(f) {
				f && (y(e), y(o), y(i), y(l), y(p), y(_)), L(t), L(s, f), L(a, f), L(m, f), T[d].d()
			},
		}
	)
}
function Jt(c) {
	let e, t, n, r
	return (
		(e = new H.Trigger({ props: { $$slots: { default: [Wt] }, $$scope: { ctx: c } } })),
		(n = new H.Content({
			props: {
				side: "bottom",
				align: "start",
				onClickOutside: c[15],
				onEscapeKeyDown: c[15],
				$$slots: { default: [Xt] },
				$$scope: { ctx: c },
			},
		})),
		{
			c() {
				R(e.$$.fragment), (t = N()), R(n.$$.fragment)
			},
			m(o, s) {
				C(e, o, s), v(o, t, s), C(n, o, s), (r = !0)
			},
			p(o, s) {
				const i = {}
				;(72 & s[0]) | (8 & s[1]) && (i.$$scope = { dirty: s, ctx: o }), e.$set(i)
				const a = {}
				;(892 & s[0]) | (8 & s[1]) && (a.$$scope = { dirty: s, ctx: o }), n.$set(a)
			},
			i(o) {
				r || (g(e.$$.fragment, o), g(n.$$.fragment, o), (r = !0))
			},
			o(o) {
				h(e.$$.fragment, o), h(n.$$.fragment, o), (r = !1)
			},
			d(o) {
				o && y(t), L(e, o), L(n, o)
			},
		}
	)
}
function Zt(c) {
	let e
	return {
		c() {
			e = W("Run git fetch to refresh branches")
		},
		m(t, n) {
			v(t, e, n)
		},
		d(t) {
			t && y(e)
		},
	}
}
function te(c) {
	let e, t, n
	return (
		(t = new rt({})),
		{
			c() {
				;(e = k("span")), R(t.$$.fragment), B(e, "slot", "iconLeft")
			},
			m(r, o) {
				v(r, e, o), C(t, e, null), (n = !0)
			},
			p: O,
			i(r) {
				n || (g(t.$$.fragment, r), (n = !0))
			},
			o(r) {
				h(t.$$.fragment, r), (n = !1)
			},
			d(r) {
				r && y(e), L(t)
			},
		}
	)
}
function ee(c) {
	let e
	return {
		c() {
			e = W("Checking workspace... ")
		},
		m(t, n) {
			v(t, e, n)
		},
		d(t) {
			t && y(e)
		},
	}
}
function ne(c) {
	let e, t, n, r, o
	const s = [Lt, Ct],
		i = []
	function a(l, m) {
		return l[1] ? 0 : 1
	}
	return (
		(n = a(c)),
		(r = i[n] = s[n](c)),
		{
			c() {
				;(e = k("div")),
					(t = k("div")),
					r.c(),
					B(t, "class", "c-commit-ref-selector__content svelte-n99er0"),
					B(e, "class", "c-commit-ref-selector svelte-n99er0")
			},
			m(l, m) {
				v(l, e, m), E(e, t), i[n].m(t, null), (o = !0)
			},
			p(l, m) {
				let p = n
				;(n = a(l)),
					n === p
						? i[n].p(l, m)
						: (U(),
							h(i[p], 1, 1, () => {
								i[p] = null
							}),
							j(),
							(r = i[n]),
							r ? r.p(l, m) : ((r = i[n] = s[n](l)), r.c()),
							g(r, 1),
							r.m(t, null))
			},
			i(l) {
				o || (g(r), (o = !0))
			},
			o(l) {
				h(r), (o = !1)
			},
			d(l) {
				l && y(e), i[n].d()
			},
		}
	)
}
const re =
	"Your current branch has not been pushed. If you want to use your current workspace, please push your branch and run git fetch to refresh."
function oe(c, e, t) {
	let n
	const r = X(gt.key),
		o = dt()
	let s,
		i,
		a,
		{ hasError: l = !1 } = e,
		{ isLoading: m = !1 } = e,
		p = [],
		_ = "",
		d = "",
		x = !0,
		P = "",
		G = !1
	const F = {
		noRemoteBranches:
			"No remote branches found. Remote agents require remote branches to work properly. Please push your current branch to remote and then run git fetch to refresh.",
		failedToFetchBranches: "Failed to fetch branches. Please try again.",
		notAGitRepository:
			"You're not inside a git repository. Remote agents require a git repository to work properly.",
	}
	async function A() {
		t(1, (m = !0))
		try {
			await D()
		} catch ($) {
			console.error("Error syncing branches:", $), I("Failed to sync with remote. Please try again.")
		} finally {
			t(1, (m = !1))
		}
	}
	async function D() {
		t(1, (m = !0)), f()
		try {
			if (!(await r.isGitRepository())) return I(F.notAGitRepository), void t(1, (m = !1))
			const $ = await r.listBranches()
			t(2, (p = $.branches)),
				(s = p.find((b) => b.isCurrentBranch)),
				t(3, (i = s)),
				(_ = await r.getRemoteUrl()),
				T(),
				l || z()
		} catch ($) {
			console.error("Error fetching git data:", $), I(F.failedToFetchBranches)
		} finally {
			t(1, (m = !1))
		}
	}
	function T() {
		if (p.length !== 0) {
			if (!s || s.isRemote) t(8, (G = !1)), f()
			else if ((t(8, (G = !0)), x)) {
				const $ = p.find((u) => u.isDefault),
					b = p.find((u) => u.isRemote)
				;(b || $) && (t(3, (i = $ ?? b)), t(6, (x = !1)), z())
			}
		} else I(F.noRemoteBranches)
	}
	function I($) {
		t(0, (l = !0)), t(7, (P = $))
	}
	function f() {
		t(0, (l = !1)), t(7, (P = ""))
	}
	async function w($ = "") {
		const b = $ || d
		t(0, (l = !1))
		try {
			const u = await r.listBranches(b)
			t(2, (p = u.branches)), T()
		} catch (u) {
			console.error("Error fetching branches:", u), t(2, (p = [])), I(F.failedToFetchBranches)
		}
	}
	async function M($) {
		$ === "workspace" ? (t(3, (i = s)), t(6, (x = !0))) : (t(3, (i = $)), t(6, (x = !1))), z()
	}
	function z() {
		if (!i || !_) return
		const $ = { github_commit_ref: { repository_url: _, git_ref: i.name } }
		o("commitRefChange", { commitRef: $, isUsingWorkspace: x, selectedBranch: i })
	}
	return (
		pt(async () => {
			await A()
		}),
		(c.$$set = ($) => {
			"hasError" in $ && t(0, (l = $.hasError)), "isLoading" in $ && t(1, (m = $.isLoading))
		}),
		(c.$$.update = () => {
			4 & c.$$.dirty[0] &&
				t(
					9,
					(n = (() => {
						const $ = p.find((S) => S.isCurrentBranch),
							b = p.find((S) => S.isDefault),
							u =
								!!$ &&
								($ == null ? void 0 : $.name) === (b == null ? void 0 : b.name.replace("origin/", ""))
						return p.filter((S) => (!u || !S.isDefault) && S.isRemote)
					})()),
				)
		}),
		[
			l,
			m,
			p,
			i,
			d,
			a,
			x,
			P,
			G,
			n,
			F,
			A,
			async function () {
				t(1, (m = !0))
				try {
					await r.fetch(), await D()
				} catch ($) {
					console.error("Error fetching and syncing branches:", $),
						I("Failed to fetch from remote. Please try again.")
				} finally {
					t(1, (m = !1))
				}
			},
			w,
			M,
			function () {
				t(4, (d = ""))
			},
			function ($) {
				$ &&
					a &&
					setTimeout(() => {
						a == null || a.focus(), w()
					}, 0)
			},
			function ($) {
				;(d = $), t(4, d)
			},
			function ($) {
				;(a = $), t(5, a)
			},
			() => w(),
			() => !G && M("workspace"),
			($) => M($),
		]
	)
}
class ce extends $t {
	constructor(e) {
		super(), mt(this, e, oe, ne, ut, { hasError: 0, isLoading: 1 }, null, [-1, -1])
	}
}
function it(c) {
	let e, t, n
	return (
		(t = new et({
			props: { color: "warning", variant: "soft", size: 2, $$slots: { default: [se] }, $$scope: { ctx: c } },
		})),
		{
			c() {
				;(e = k("div")), R(t.$$.fragment), B(e, "class", "diff-warning svelte-19f9ovv")
			},
			m(r, o) {
				v(r, e, o), C(t, e, null), (n = !0)
			},
			p(r, o) {
				const s = {}
				33554436 & o && (s.$$scope = { dirty: o, ctx: r }), t.$set(s)
			},
			i(r) {
				n || (g(t.$$.fragment, r), (n = !0))
			},
			o(r) {
				h(t.$$.fragment, r), (n = !1)
			},
			d(r) {
				r && y(e), L(t)
			},
		}
	)
}
function se(c) {
	let e
	return {
		c() {
			e = W(c[2])
		},
		m(t, n) {
			v(t, e, n)
		},
		p(t, n) {
			4 & n && K(e, t[2])
		},
		d(t) {
			t && y(e)
		},
	}
}
function lt(c) {
	let e, t, n
	return (
		(t = new et({
			props: { color: "error", variant: "soft", size: 2, $$slots: { default: [ae] }, $$scope: { ctx: c } },
		})),
		{
			c() {
				;(e = k("div")), R(t.$$.fragment), B(e, "class", "error-message svelte-19f9ovv")
			},
			m(r, o) {
				v(r, e, o), C(t, e, null), (n = !0)
			},
			p(r, o) {
				const s = {}
				33554464 & o && (s.$$scope = { dirty: o, ctx: r }), t.$set(s)
			},
			i(r) {
				n || (g(t.$$.fragment, r), (n = !0))
			},
			o(r) {
				h(t.$$.fragment, r), (n = !1)
			},
			d(r) {
				r && y(e), L(t)
			},
		}
	)
}
function ae(c) {
	let e
	return {
		c() {
			e = W(c[5])
		},
		m(t, n) {
			v(t, e, n)
		},
		p(t, n) {
			32 & n && K(e, t[5])
		},
		d(t) {
			t && y(e)
		},
	}
}
function ie(c) {
	let e
	return {
		c() {
			e = W("Create Agent")
		},
		m(t, n) {
			v(t, e, n)
		},
		d(t) {
			t && y(e)
		},
	}
}
function le(c) {
	let e, t, n, r, o, s, i, a, l, m, p, _, d, x, P, G, F, A, D, T
	function I(u) {
		c[13](u)
	}
	function f(u) {
		c[14](u)
	}
	n = new Rt({ props: { agentId: null } })
	let w = {}
	function M(u) {
		c[15](u)
	}
	c[0] !== void 0 && (w.hasError = c[0]),
		c[1] !== void 0 && (w.isLoading = c[1]),
		(a = new ce({ props: w })),
		q.push(() => Y(a, "hasError", I)),
		q.push(() => Y(a, "isLoading", f)),
		a.$on("commitRefChange", c[8])
	let z = {
		placeholder: "Describe what you want your agent to do...",
		rows: 4,
		resize: "vertical",
		class: "themed-textarea",
	}
	c[6] !== void 0 && (z.value = c[6]), (d = new ht({ props: z })), q.push(() => Y(d, "value", M))
	let $ = c[2] && it(c),
		b = c[5] && lt(c)
	return (
		(D = new Z({
			props: {
				variant: "solid",
				size: 2,
				disabled: !c[6].trim() || c[0] || c[1] || c[3] || c[4],
				color: "accent",
				highContrast: !0,
				loading: c[3] || c[4],
				$$slots: { default: [ie] },
				$$scope: { ctx: c },
			},
		})),
		D.$on("click", c[16]),
		{
			c() {
				;(e = k("div")),
					(t = k("header")),
					R(n.$$.fragment),
					(r = N()),
					(o = k("div")),
					(s = k("h2")),
					(s.textContent = "Create New Agent"),
					(i = N()),
					R(a.$$.fragment),
					(p = N()),
					(_ = k("div")),
					R(d.$$.fragment),
					(P = N()),
					$ && $.c(),
					(G = N()),
					b && b.c(),
					(F = N()),
					(A = k("div")),
					R(D.$$.fragment),
					B(t, "class", "header svelte-19f9ovv"),
					B(s, "class", "svelte-19f9ovv"),
					B(A, "class", "actions svelte-19f9ovv"),
					B(_, "class", "card-content svelte-19f9ovv"),
					B(o, "class", "content svelte-19f9ovv"),
					B(e, "class", "new-agent svelte-19f9ovv")
			},
			m(u, S) {
				v(u, e, S),
					E(e, t),
					C(n, t, null),
					E(e, r),
					E(e, o),
					E(o, s),
					E(o, i),
					C(a, o, null),
					E(o, p),
					E(o, _),
					C(d, _, null),
					E(_, P),
					$ && $.m(_, null),
					E(_, G),
					b && b.m(_, null),
					E(_, F),
					E(_, A),
					C(D, A, null),
					(T = !0)
			},
			p(u, [S]) {
				const tt = {}
				!l && 1 & S && ((l = !0), (tt.hasError = u[0]), V(() => (l = !1))),
					!m && 2 & S && ((m = !0), (tt.isLoading = u[1]), V(() => (m = !1))),
					a.$set(tt)
				const ot = {}
				!x && 64 & S && ((x = !0), (ot.value = u[6]), V(() => (x = !1))),
					d.$set(ot),
					u[2]
						? $
							? ($.p(u, S), 4 & S && g($, 1))
							: (($ = it(u)), $.c(), g($, 1), $.m(_, G))
						: $ &&
							(U(),
							h($, 1, 1, () => {
								$ = null
							}),
							j()),
					u[5]
						? b
							? (b.p(u, S), 32 & S && g(b, 1))
							: ((b = lt(u)), b.c(), g(b, 1), b.m(_, F))
						: b &&
							(U(),
							h(b, 1, 1, () => {
								b = null
							}),
							j())
				const Q = {}
				91 & S && (Q.disabled = !u[6].trim() || u[0] || u[1] || u[3] || u[4]),
					24 & S && (Q.loading = u[3] || u[4]),
					33554432 & S && (Q.$$scope = { dirty: S, ctx: u }),
					D.$set(Q)
			},
			i(u) {
				T ||
					(g(n.$$.fragment, u),
					g(a.$$.fragment, u),
					g(d.$$.fragment, u),
					g($),
					g(b),
					g(D.$$.fragment, u),
					(T = !0))
			},
			o(u) {
				h(n.$$.fragment, u), h(a.$$.fragment, u), h(d.$$.fragment, u), h($), h(b), h(D.$$.fragment, u), (T = !1)
			},
			d(u) {
				u && y(e), L(n), L(a), L(d), $ && $.d(), b && b.d(), L(D)
			},
		}
	)
}
const ft = "Failed to create a remote agent. Please try again."
function fe(c, e, t) {
	let n
	const r = X("agentManagerModel"),
		o = X(vt.key),
		s = X(gt.key),
		i = 1048576,
		a = 0.75 * i
	let l,
		m = null,
		p = !1,
		_ = !1,
		d = !1,
		x = null,
		P = !1,
		G = !1,
		F = null,
		A = null
	async function D() {
		t(12, (A = await o.getSetupScript())),
			console.log("setup script content: ", A),
			A || t(12, (A = "bash research/research-init.sh"))
	}
	async function T(f, w) {
		t(3, (P = !0))
		let M = { ...w }
		try {
			const z = await s.getWorkspaceDiff(f.name)
			z && z.length > a
				? t(
						2,
						(x = (function ($) {
							return `
      There are many unpushed changes in your current workspace (${($.length / i).toFixed(2)}MB).
      The agent creation may fail or take longer than usual. Consider committing and pushing your changes before creating an agent, or select a different workspace.`
						})(z)),
					)
				: t(2, (x = null)),
				(M = { ...w, github_commit_ref: { ...w.github_commit_ref, patch: z } })
		} catch (z) {
			console.error("Error getting workspace diff:", z),
				t(2, (x = "Failed to calculate workspace diff. The agent may not include your latest changes."))
		} finally {
			t(3, (P = !1))
		}
		return M
	}
	pt(async () => {
		await D()
	})
	let I = ""
	return (
		(c.$$.update = () => {
			7680 & c.$$.dirty &&
				t(
					7,
					(n = async (f) => {
						if (m && l) {
							t(5, (F = null)), t(4, (G = !0))
							try {
								d && t(9, (m = await T(l, m)))
								const w = { starting_files: { github_commit_ref: m.github_commit_ref } }
								await D()
								const M = await o.createRemoteAgent(f, w, A ?? void 0)
								M
									? r.showAgentDetail(M)
									: (console.error("Failed to create remote agent: no agent ID returned from API"),
										t(5, (F = ft)))
							} catch (w) {
								console.error("Error creating remote agent:", w), t(5, (F = ft))
							} finally {
								t(4, (G = !1))
							}
						} else console.error("No commit ref or selected branch")
					}),
				)
		}),
		[
			p,
			_,
			x,
			P,
			G,
			F,
			I,
			n,
			function (f) {
				t(9, (m = f.detail.commitRef)),
					t(10, (d = f.detail.isUsingWorkspace)),
					t(11, (l = f.detail.selectedBranch)),
					d && l && !l.isRemote && t(10, (d = !1)),
					d ? T(l, m) : t(2, (x = null))
			},
			m,
			d,
			l,
			A,
			function (f) {
				;(p = f), t(0, p)
			},
			function (f) {
				;(_ = f), t(1, _)
			},
			function (f) {
				;(I = f), t(6, I)
			},
			() => n(I),
		]
	)
}
class Ne extends $t {
	constructor(e) {
		super(), mt(this, e, fe, le, ut, {})
	}
}
export { Ne as default }
