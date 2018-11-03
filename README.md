# minecraft-scripting-toolchain

Helps with some common tasks when building a minecraft mod for Bedrock edition:
* builds an mcaddon directory (*incomplete*)
* installs the mod into Minecraft for Windows 10's development folders
* watches for file changes and reinstalls as neccessary
* has extension points to do transpilation
* (*not implemented*) build a .mcaddon

## Prerequisites
| Software    | Minimum                                     | Recommended                                               | 
| ----------- | ------------------------------------------- | --------------------------------------------------------- | 
| Minecraft   | Minecraft on your Windows 10 device         | Minecraft on your Windows 10 device                       |
| Storage     | 1.0 GB of free space for text editor, game, and scripts | 3.0 GB of free space for Visual Studio, game, and scripts |
| Node.js     | 8.x                                         | 10.x                                                      |


## Getting Started
Ensure you have a package.json file present in your development directory, if you do not, you can create a minimal valid package with the following contents:
```json
{
  "private": "true",
}
```

install the package (It's not currently available on NPM, you'll have to use the Github repository)
```
npm install --save-dev github:minecraft-addon-tools/minecraft-scripting-toolchain
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

## Conventions

These scripts will assume a certain directory structure by default. These can be overridden by altering properties on the `MinecraftModBuilder` object in your gulpfile.js.

| directory | purpose | config property |
|-----------|---------|-----------------|
| .\src\scripts | Any JavaScript/TypeScript/etc files that make up the code | scriptsDir |
| .\src\behaviors | files that are part of the behaviors | behaviorDir |
| .\src\resources | files that are part of the resources | resourceDir |
| .\built | the constructed mcaddon directory | outDir |

an example of changing the build directory would look something like this:
```javascript
const MinecraftModBuilder = require("minecraft-scripting-toolchain")
const modBuilder = new MinecraftModBuilder(<yourmodname>);
modBuilder.outDir = "./out"
```

## Using with TypeScript
It is recommended if you use TypeScript to use the `minecraft-scripting-types` packge to give better code hints, see [minecraft-addon-tools/minecraft-script-types](http://github.com/minecraft-addon-tools/minecraft-script-types) for more details. The following steps will assume this is also installed.

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
    module: "ES6" //Must be ES6 because otherwise code gets generated that Minecraft doesn't support
    noImplicitAny: true,
    types: [ "minecraft-scripting-types" ] // You won't need this line if you're not using the types
});

modBuilder.scriptTasks = [compileTypeScript];

module.exports = modBuilder.configureEverythingForMe();
```

Note that compileTypeScript is a function, not just a call to `ts` failing to do this will result in gulp and gulp-typescript trying to re-use a completed set of files and failing.