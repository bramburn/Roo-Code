
function $b(...l) {
	return (
		"/" +
		l
			.flatMap((Z) => Z.split("/"))
			.filter((Z) => !!Z)
			.join("/")
	)
}