# minecraft-scripting-toolchain

Helps with some common tasks when building a minecraft mod for Bedrock edition:
* builds an mcaddon directory (*incomplete*)
* installs the mod into Minecraft for Windows 10's development folders
* watches for file changes and reinstalls as neccessary
* has extension points to do transpilation
* (*not implemented*) build a .mcaddon

## Getting Started
install the package (It's not currently available on NPM, you'll have to use the Github repository)
```
npm install --save-dev github:atomicblom/minecraft-scripting-toolchain#38477e1500f44a964aa97f4cf4bae9f14d35375a
```

This will automatically install gulp vNext (4.0.0)

## Create a gulpfile.js gulp configuration

use the following as a template for your gulpfile.js, replacing `<yourmodname>` with the name of your mod, which will be used on the filesystem to identify your mod

```javascript
const MinecraftModBuilder = require("minecraft-scripting-toolchain")

const modBuilder = new MinecraftModBuilder(<yourmodname>);
module.exports = modBuilder.configureEverythingForMe();
```

The MinecraftModBuilder object can be used to create your own tasks, but the default tasks configured by `configureEverythingForMe()` should be sufficient for simple mods.

Next, update your packge.json with appropriate scripts, here are some useful scripts
```json
  "scripts": {
    "build": "gulp build",
    "installmod": "gulp install",
    "rebuild": "gulp rebuild",
    "watch": "gulp watch"
  },
```

* use **npm run build** to create the directory structure for a .mcaddon
* use **npm run installmod** to install the mod into Minecraft for Windows 10
* use **npm run rebuild** to clean the build directory and rebuild it
* use **npm run watch** to:
    * build the project
    * deploy it to to Minecraft for Windows 10
    * monitor for changes on the filesystem
        * automatically rebuilds and deploys the project.

## Using with TypeScript
It is recommended if you use TypeScript to use the `minecraft-scripting-types` packge to give better code hints, see [atomicblom/minecraft-script-types](http://github.com/AtomicBlom/minecraft-script-types) for more details. The following steps will assume this is also installed.

Install the prerequisites to get started
```
npm install --save-dev gulp-typescript
```

Now edit your `gulpfile.js` and add typescript to the scriptTasks setting on the MinecraftModBuilder (again remembering to replace `<yourmodname>` as appropriate):

```javascript
const ts = require("gulp-typescript");
const MinecraftModBuilder = require("minecraft-scripting-toolchain")

const modBuilder = new MinecraftModBuilder(<yourmodname>);

compileTypeScript = () => ts({
    noImplicitAny: true,
    "types": [ "minecraft-scripting-types" ] // You won't need this line if you're not using the types
});

modBuilder.scriptTasks = [compileTypeScript];

module.exports = modBuilder.configureEverythingForMe();
```

Note that compileTypeScript is a function, not just a call to `ts` failing to do this will result in gulp and gulp-typescript trying to re-use a completed set of files and failing.