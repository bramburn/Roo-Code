
function zY(l) {
	return l.replace(kY, (Z, b) =>
		(b = b.toLowerCase()) === "colon"
			? ":"
			: b.charAt(0) === "#"
				? b.charAt(1) === "x"
					? String.fromCharCode(parseInt(b.substring(2), 16))
					: String.fromCharCode(+b.substring(1))
				: "",
	)
}