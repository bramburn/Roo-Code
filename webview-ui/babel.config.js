module.exports = function (api) {
	api.cache(true)
	return {
		presets: [
			["@babel/preset-env", { targets: { node: "current" } }],
			"@babel/preset-typescript",
			["@babel/preset-react", { runtime: "automatic" }],
		],
		plugins: [["@babel/plugin-transform-runtime", { regenerator: true }]],
	}
}
