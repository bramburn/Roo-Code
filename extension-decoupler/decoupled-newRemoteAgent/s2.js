
function S2(l, Z, b) {
	return (
		(Z = F2(Z)) in l
			? Object.defineProperty(l, Z, { value: b, enumerable: !0, configurable: !0, writable: !0 })
			: (l[Z] = b),
		l
	)
}