
const tm = {},
	El = (l) => {
		console.error(l)
	},
	Km = (l, ...Z) => {
		console.log(`WARN: ${l}`, ...Z)
	},
	Al = (l, Z) => {
		tm[`${l}/${Z}`] || (console.log(`Deprecated as of ${l}. ${Z}`), (tm[`${l}/${Z}`] = !0))
	},
	yZ = new Error()