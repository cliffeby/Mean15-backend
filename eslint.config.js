const { defineConfig } = require("eslint/config");

module.exports = defineConfig([
	// matches all files ending with .js
	{
		files: ["**/*.js"],
		rules: {
			semi: "error",
		},
	},

	// matches all files ending with .js except those in __tests
	{
		files: ["**/*.js"],
		ignores: ["__tests/**"],
		rules: {
			"no-console": "off",
		},
	},
]);