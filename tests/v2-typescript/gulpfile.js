const MinecraftAddonBuilder = require("minecraft-addon-toolchain");
const TypeScriptSupport = require("minecraft-addon-toolchain-typescript");
const BrowserifySupport = require("minecraft-addon-toolchain-browserify");
const TerserSupport = require("minecraft-addon-toolchain-terser");

const builder = new MinecraftAddonBuilder.v2("ToolchainTest");

builder.addPlugin(new TypeScriptSupport(builder));
builder.addPlugin(new TerserSupport(builder));
builder.addPlugin(new BrowserifySupport(builder));

module.exports = builder.configureEverythingForMe();
