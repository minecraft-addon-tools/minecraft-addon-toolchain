const MinecraftAddonBuilder = require("../../v1");
const ts = require("gulp-typescript");

const builder = new MinecraftAddonBuilder("ToolchainTest");
builder.scriptTasks = [
    () => ts({
        module: "ES6",
        noImplicitAny: true
    })
];

module.exports = builder.configureEverythingForMe();
