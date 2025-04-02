
function bb(l, Z, b) {
	if (l.slice(0, Z.length) != Z)
		throw Error(
			"string "
				.concat(JSON.stringify(l), " doesn't start with prefix ")
				.concat(JSON.stringify(Z), "; this is a bug"),
		)
	return b + l.slice(Z.length)
}