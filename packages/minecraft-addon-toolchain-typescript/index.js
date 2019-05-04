/// <reference types="minecraft-addon-toolchain/v1" />
const ts = require("gulp-typescript");

/**
 * @type{IPlugin}
 */
class TypeScriptSupport {
  constructor() {
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

  set builder(builder) {
    if (builder._version < 1) {
      throw new Error(
        "TypeScript support requires using a minecraft-addon-toolchain with at least version 1 or higher"
      );
    }
  }
}

module.exports = TypeScriptSupport;
