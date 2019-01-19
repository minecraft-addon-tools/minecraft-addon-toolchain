# minecraft-addon-toolchain-terser

## Terser
Adds support for obfuscating and minifying the JavaScript before it is packaged into `.mcpack` and `.mcaddon` files.

### Installing
```powershell
npm install --save-dev minecraft-addon-toolchain-terser
```

### Adding to the toolchain
```javascript
const MinecraftAddonBuilder = require("minecraft-addon-toolchain/v1");
const TerserSupport = require("minecraft-addon-toolchain-terser");

const builder = new MinecraftAddonBuilder(<youraddonname>);
builder.addPlugin(new TerserSupport());

module.exports = builder.configureEverythingForMe();
```

### Usage
There is nothing you need to do, your builds will be minified and obfuscated whenever you run the `package` gulp task.
