# minecraft-addon-toolchain-browserify

## Browserify
Adds support for modern JavaScript features not supported by the Minecraft Scripting Engine, such as modules and multi-file projects.

**By default, UI JavaScript files are not processed by browserify as these scripts typically can be loaded individually without needint to package them. If you wish to package your UI code, you should check the `bundleSources` and `entryPoints` configuration settings**

### Installing
```powershell
npm install --save-dev minecraft-addon-toolchain-browserify
```

### Adding to the toolchain
```javascript
const MinecraftAddonBuilder = require("minecraft-addon-toolchain/v1");
const BrowserifySupport = require("minecraft-addon-toolchain-browserify");

const builder = new MinecraftAddonBuilder(<youraddonname>);
builder.addPlugin(new BrowserifySupport());

module.exports = builder.configureEverythingForMe();
```

### Usage
You can create additional files using ES6 module support, exporting and importing from other files and NPM packages.

An example of this might be

`./scripts/util/maths.js`
```javascript
export function squareDistance(x1, y1, z1, x2, y2, z2) {
    return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1) + (z2 - z1) * (z2 - z1);
}
```

`./scripts/server/server.js`
```javascript
import { squareDistance } from "../util/maths"

...

system.update = function() {
    // gather variables.
    squareDistance(x1, y1, x1, x2, y2, z2);
}
```

### Configuration
You can override the settings passed to Babelify any of the following settings the BrowserifySupport object.

```javascript
const MinecraftAddonBuilder = require("minecraft-addon-toolchain/v1");
const BrowserifySupport = require("minecraft-addon-toolchain-browserify");

const builder = new MinecraftAddonBuilder(<youraddonname>);
const browserifySupport = new BrowserifySupport();

/// Modify options that browserify will use
//browserifySupport.browserifyOptions

/// Modify options that browserify will pass to babel
//browserifySupport.babelOptions

/// Add a new language feature to babel, you will need to install the corresponding babel plugin via npm:
//browserifySupport.babelOptions.plugins.push("<some-babel-plugin>");

/// Change the intermediate output directory
//browserifySupport.intermediateDir = "./out/before-browserify";

/// Change the entry point scripts that will be bundled.
//browserifySupport.entryPoints = ["scripts/client/*.js", "scripts/server/*.js"];

/// Add additional files to be bundled
//browserifySupport.bundleSources = ["scripts/**/*.js" ];

builder.addPlugin(browserifySupport);

module.exports = builder.configureEverythingForMe();
```

For further information about the various configuration options provided by the various tools, consult the following links:

| field name          | documentation link                                             |
| ------------------- | -------------------------------------------------------------- |
| `browserifyOptions` | https://github.com/browserify/browserify#browserifyfiles--opts |
| `babelOptions`      | https://babeljs.io/docs/en/options                             |