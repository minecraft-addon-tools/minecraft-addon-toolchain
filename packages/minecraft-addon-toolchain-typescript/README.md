# minecraft-addon-toolchain-typescript

## TypeScript

Adds TypeScript support. `.ts` files will be compiled to `.js` and added to the bundled output.

It is recommended if you use TypeScript to use the `minecraft-scripting-types` package to give better code hints, see [minecraft-addon-tools/minecraft-scripting-types](http://github.com/minecraft-addon-tools/minecraft-scripting-types) for more details. The following steps will assume this will also be installed.

### Installing

```powershell
npm install --save-dev minecraft-addon-toolchain-typescript
npm install --save-dev minecraft-scripting-types
```

### Adding to the toolchain

TypeScript support is a language transformation and should be one of the first plugins added. It must come before any bundling plugins, such as Browserify.

```javascript
const MinecraftAddonBuilder = require("minecraft-addon-toolchain/v1");
const TypeScriptSupport = require("minecraft-addon-toolchain-typescript");

const builder = new MinecraftAddonBuilder(<youraddonname>);
builder.addPlugin(new TypeScriptSupport());

module.exports = builder.configureEverythingForMe();
```

### Usage

Create TypeScript `.ts` files in place of where you would normally create a JavaScript file.

By default, Behavior packs with Scripts will assume that anything in `./scripts/client/*.ts` and `./scripts/server/*.ts` are entry points for addon scripts.

TypeScript does not come with support for multi-file editing by default due to the lack of a module loader in Minecraft by default.

### Configuration

You can override the settings passed to the TypeScript compiler by changing the `settings` field of the TypeScriptSupport object.

```javascript
const MinecraftAddonBuilder = require("minecraft-addon-toolchain/v1");
const TypeScriptSupport = require("minecraft-addon-toolchain-typescript");

const builder = new MinecraftAddonBuilder(<youraddonname>);
const typeScriptSupport = new TypeScriptSupport();
/// Modify the settings here.
//typeScriptSupport.settings
builder.addPlugin(typeScriptSupport);

module.exports = builder.configureEverythingForMe();
```
