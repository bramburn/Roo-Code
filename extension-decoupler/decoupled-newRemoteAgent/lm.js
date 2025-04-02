
class Lm {
	constructor(Z) {
		Z.data === void 0 && (Z.data = {}), (this.data = Z.data), (this.isMatchIgnored = !1)
	}
	ignoreMatch() {
		this.isMatchIgnored = !0
	}
}