
const VZ = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,
	ai = /(?:[*+-]|\d{1,9}[.)])/,
	pi = cl(/^(?!bull )((?:.|\n(?!\s*?\n|bull ))+?)\n {0,3}(=+|-+) *(?:\n+|$)/)
		.replace(/bull/g, ai)
		.getRegex(),
	Rb = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,
	ub = /(?!\s*\])(?:\\.|[^\[\]\\])+/,
	MY = cl(/^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/)
		.replace("label", ub)
		.replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/)
		.getRegex(),
	wY = cl(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/)
		.replace(/bull/g, ai)
		.getRegex(),
	LZ =
		"address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul",
	ab = /<!--(?!-?>)[\s\S]*?(?:-->|$)/,
	vY = cl(
		"^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))",
		"i",
	)
		.replace("comment", ab)
		.replace("tag", LZ)
		.replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/)
		.getRegex(),
	hm = cl(Rb)
		.replace("hr", VZ)
		.replace("heading", " {0,3}#{1,6}(?:\\s|$)")
		.replace("|lheading", "")
		.replace("|table", "")
		.replace("blockquote", " {0,3}>")
		.replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n")
		.replace("list", " {0,3}(?:[*+-]|1[.)]) ")
		.replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)")
		.replace("tag", LZ)
		.getRegex(),
	pb = {
		blockquote: cl(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/)
			.replace("paragraph", hm)
			.getRegex(),
		code: /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/,
		def: MY,
		fences: /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,
		heading: /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,
		hr: VZ,
		html: vY,
		lheading: pi,
		list: wY,
		newline: /^(?: *(?:\n|$))+/,
		paragraph: hm,
		table: mZ,
		text: /^[^\n]+/,
	},
	sm = cl(
		"^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)",
	)
		.replace("hr", VZ)
		.replace("heading", " {0,3}#{1,6}(?:\\s|$)")
		.replace("blockquote", " {0,3}>")
		.replace("code", " {4}[^\\n]")
		.replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n")
		.replace("list", " {0,3}(?:[*+-]|1[.)]) ")
		.replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)")
		.replace("tag", LZ)
		.getRegex(),
	EY = {
		...pb,
		table: sm,
		paragraph: cl(Rb)
			.replace("hr", VZ)
			.replace("heading", " {0,3}#{1,6}(?:\\s|$)")
			.replace("|lheading", "")
			.replace("table", sm)
			.replace("blockquote", " {0,3}>")
			.replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n")
			.replace("list", " {0,3}(?:[*+-]|1[.)]) ")
			.replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)")
			.replace("tag", LZ)
			.getRegex(),
	},
	QY = {
		...pb,
		html: cl(
			`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`,
		)
			.replace("comment", ab)
			.replace(
				/tag/g,
				"(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b",
			)
			.getRegex(),
		def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
		heading: /^(#{1,6})(.*)(?:\n+|$)/,
		fences: mZ,
		lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
		paragraph: cl(Rb)
			.replace("hr", VZ)
			.replace(
				"heading",
				` *#{1,6} *[^
]`,
			)
			.replace("lheading", pi)
			.replace("|table", "")
			.replace("blockquote", " {0,3}>")
			.replace("|fences", "")
			.replace("|list", "")
			.replace("|html", "")
			.replace("|tag", "")
			.getRegex(),
	},
	yi = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
	hi = /^( {2,}|\\)\n(?!\s*$)/,
	XZ = "\\p{P}$+<=>`^|~",
	jY = cl(/^((?![*_])[\spunctuation])/, "u")
		.replace(/punctuation/g, XZ)
		.getRegex(),
	OY = cl(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u")
		.replace(/punct/g, XZ)
		.getRegex(),
	DY = cl(
		"^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])",
		"gu",
	)
		.replace(/punct/g, XZ)
		.getRegex(),
	AY = cl(
		"^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])",
		"gu",
	)
		.replace(/punct/g, XZ)
		.getRegex(),
	fY = cl(/\\([punct])/, "gu")
		.replace(/punct/g, XZ)
		.getRegex(),
	PY = cl(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/)
		.replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/)
		.replace(
			"email",
			/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/,
		)
		.getRegex(),
	rY = cl(ab).replace("(?:-->|$)", "-->").getRegex(),
	_Y = cl(
		"^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>",
	)
		.replace("comment", rY)
		.replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/)
		.getRegex(),
	BZ = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/,
	qY = cl(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/)
		.replace("label", BZ)
		.replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/)
		.replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/)
		.getRegex(),
	Nm = cl(/^!?\[(label)\]\[(ref)\]/)
		.replace("label", BZ)
		.replace("ref", ub)
		.getRegex(),
	nm = cl(/^!?\[(ref)\](?:\[\])?/)
		.replace("ref", ub)
		.getRegex(),
	yb = {
		_backpedal: mZ,
		anyPunctuation: fY,
		autolink: PY,
		blockSkip: /\[[^[\]]*?\]\([^\(\)]*?\)|`[^`]*?`|<[^<>]*?>/g,
		br: hi,
		code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
		del: mZ,
		emStrongLDelim: OY,
		emStrongRDelimAst: DY,
		emStrongRDelimUnd: AY,
		escape: yi,
		link: qY,
		nolink: nm,
		punctuation: jY,
		reflink: Nm,
		reflinkSearch: cl("reflink|nolink(?!\\()", "g").replace("reflink", Nm).replace("nolink", nm).getRegex(),
		tag: _Y,
		text: /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,
		url: mZ,
	},
	$Y = {
		...yb,
		link: cl(/^!?\[(label)\]\((.*?)\)/)
			.replace("label", BZ)
			.getRegex(),
		reflink: cl(/^!?\[(label)\]\s*\[([^\]]*)\]/)
			.replace("label", BZ)
			.getRegex(),
	},
	Wb = {
		...yb,
		escape: cl(yi).replace("])", "~|])").getRegex(),
		url: cl(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i")
			.replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/)
			.getRegex(),
		_backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
		del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
		text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/,
	},
	lg = {
		...Wb,
		br: cl(hi).replace("{2,}", "*").getRegex(),
		text: cl(Wb.text)
			.replace("\\b_", "\\b_| {2,}\\n")
			.replace(/\{2,\}/g, "*")
			.getRegex(),
	},
	aZ = { normal: pb, gfm: EY, pedantic: QY },
	bZ = { normal: yb, gfm: Wb, breaks: lg, pedantic: $Y }