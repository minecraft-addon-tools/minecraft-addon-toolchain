const ts = require("gulp-typescript");

class TypeScriptSupport {
    constructor(builder) {
        if (builder._version < 2) {
            throw new Error("TypeScript support requires using a minecraft-addon-toolchain with at least version 2 or higher");
        }

        this.settings = {
            module: "ES6",
            noImplicitAny: true,
            target: "ES6"
        };

        this.sourceTasks = [
            {
                condition: "**/*.ts",
                task: () => ts(this.settings)
            }
        ];
    }
}

module.exports = TypeScriptSupport;