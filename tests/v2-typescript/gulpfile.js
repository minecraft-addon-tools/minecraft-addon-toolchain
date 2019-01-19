const MinecraftAddonBuilder = require("minecraft-addon-toolchain/v2");
const TypeScriptSupport = require("minecraft-addon-toolchain-typescript");
const BrowserifySupport = require("minecraft-addon-toolchain-browserify");
const TerserSupport = require("minecraft-addon-toolchain-terser");

const builder = new MinecraftAddonBuilder("ToolchainTest");

builder.addPlugin(new TypeScriptSupport(builder));
builder.addPlugin(new TerserSupport(builder));
builder.addPlugin(new BrowserifySupport(builder));

module.exports = builder.configureEverythingForMe();
