/// <reference types="minecraft-addon-toolchain/v1" />
const terser = require("gulp-terser");

/**
 * @type{IPlugin}
 */
class UglifySupport {
	constructor() {
		this.createMCPackTasks = [
			{
				condition: "**/*.js",
				task: () => terser()
			}
		];
	}

	set builder(builder) {
		if (builder._version < 1) {
			throw new Error(
				"terser support requires using a minecraft-addon-toolchain with at least version 1 or higher"
			);
		}
	}
}

module.exports = UglifySupport;
