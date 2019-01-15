const terser = require("gulp-terser");

class UglifySupport {
    constructor(builder) {
        if (builder._version < 2) {
            throw new Error("terser support requires using a minecraft-addon-toolchain with at least version 2 or higher");
        }

        this.createMCPackTasks = [
            {
                condition: "**/*.js",
                task: () => terser()
            }
        ];
    }
}

module.exports = UglifySupport;