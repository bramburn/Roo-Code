
const Ri = /[&<>"']/,
	UY = new RegExp(Ri.source, "g"),
	ui = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
	tY = new RegExp(ui.source, "g"),
	KY = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" },
	um = (l) => KY[l]