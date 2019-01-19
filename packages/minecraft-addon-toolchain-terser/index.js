const terser = require("gulp-terser");

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
        if (builder._version < 2) {
            throw new Error("terser support requires using a minecraft-addon-toolchain with at least version 2 or higher");
        }
    }
}

module.exports = UglifySupport;