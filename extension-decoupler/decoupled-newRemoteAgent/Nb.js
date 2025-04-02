
function nb(...l) {
	return (
		"(" +
		((function (b) {
			const m = b[b.length - 1]
			return typeof m == "object" && m.constructor === Object ? (b.splice(b.length - 1, 1), m) : {}
		})(l).capture
			? ""
			: "?:") +
		l.map((b) => cZ(b)).join("|") +
		")"
	)
}