
function Gb(l) {
	return (
		(Gb =
			typeof Symbol == "function" && typeof Symbol.iterator == "symbol"
				? function (Z) {
						return typeof Z
					}
				: function (Z) {
						return Z && typeof Symbol == "function" && Z.constructor === Symbol && Z !== Symbol.prototype
							? "symbol"
							: typeof Z
					}),
		Gb(l)
	)
}