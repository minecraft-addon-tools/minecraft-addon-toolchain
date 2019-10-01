# minecraft-addon-toolchain

Helps with some common tasks when building a minecraft mod for Bedrock edition:

-   builds `.mcpack` and `.mcaddon` packages
-   installs the mod into Minecraft for Windows 10's development folders
-   watches for file changes and reinstalls as necessary
-   has extension points to do transpilation

## Prerequisites

| Software  | Minimum                                                 | Recommended                                               |
| --------- | ------------------------------------------------------- | --------------------------------------------------------- |
| Minecraft | Minecraft Bedrock Edition Beta                          | Minecraft Bedrock Edition Beta on your Windows 10 device  |
| Storage   | 1.0 GB of free space for text editor, game, and scripts | 3.0 GB of free space for Visual Studio, game, and scripts |
| Node.js   | 8.x                                                     | 10.x                                                      |

Scripting in Minecraft is currently only officially supported on Windows 10 Bedrock Edition Beta, however there have been reports that users have been able to use alternative launchers to get scripting working on other platforms, and although the toolchain attempts to support Linux, Mac OS and Android, they are currently untested and support for these platforms is limited. (I am happy to take PRs to improve the experience)

### Getting the Bedrock Edition Beta

Mojang provides instructions on how to get into the Beta program here: [How to get into Minecraft betas](https://minecraft.net/en-us/article/how-get-minecraft-betas)

## Getting Started

Ensure you have a package.json file present in your development directory, if you do not, you can create a minimal valid package with the following contents:

```json
{
	"private": true
}
```

install the package (It's not currently available on NPM, you'll have to use the Github repository)

```
npm install --save-dev minecraft-addon-toolchain
```

This will automatically install gulp vNext (4.0.0)

## Create a gulpfile.js gulp configuration

use the following as a template for your gulpfile.js, replacing `<youraddonname>` with the name of your mod, which will be used on the filesystem to identify your mod

```javascript
const MinecraftAddonBuilder = require("minecraft-addon-toolchain/v1");

const builder = new MinecraftAddonBuilder(<youraddonname>);
module.exports = builder.configureEverythingForMe();
```

The MinecraftAddonBuilder object can be used to create your own tasks, but the default tasks configured by `configureEverythingForMe()` should be sufficient for simple addons.

Next, update your package.json with appropriate scripts, here are some useful scripts

```json
  "scripts": {
    "build": "gulp build",
    "installaddon": "gulp install",
    "rebuild": "gulp rebuild",
    "watch": "gulp watch"
  },
```

-   use **npm run build** to create the directory structure for a .mcaddon
-   use **npm run installaddon** to install the addon into Minecraft for Windows 10
-   use **npm run rebuild** to clean the build directory and rebuild it
-   use **npm run watch** to:
    -   build the project
    -   deploy it to to Minecraft for Windows 10
    -   monitor for changes on the filesystem
        -   automatically rebuilds and deploys the project.

## Conventions

These scripts will assume a certain directory structure by default. These can be overridden by altering properties on the `MinecraftModBuilder` object in your gulpfile.js.

| directory      | purpose                                                                                                                | config property |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------- |
| .\packs        | place a directory in here for each pack you have. The type of the pack will be determined by it's `manifest.json` file | sourceDir       |
| .\out\bundled  | the constructed pack directories will be assembled here, ready for deployment into Minecraft                           | bundleDir       |
| .\out\packaged | constructed .mcpack and .mcaddon files will be placed here                                                             | packageDir      |

an example of changing the build directory would look something like this:

```javascript
const MinecraftAddonBuilder = require("minecraft-addon-toolchain/v1");

const builder = new MinecraftAddonBuilder(<youraddonname>);
builder.bundleDir = "./bundle";
builder.packageDir = "./package";
```

## Using plugins

We provide the following plugins.

Because plugins insert themselves into the toolchain, their order is dependent. Refer to their individual read me files for installation and usage.

| NPM package                          | Purpose                                                                                            | Readme                                                                                                                                                              |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| minecraft-addon-toolchain-typescript | Adds support for TypeScript                                                                        | [TypeScript Plugin read me](https://github.com/minecraft-addon-tools/minecraft-addon-toolchain/blob/master/packages/minecraft-addon-toolchain-typescript/README.md) |
| minecraft-addon-toolchain-browserify | Adds support for modern JavaScript features, especially module loading and multi-file projects     | [Browserify Plugin read me](https://github.com/minecraft-addon-tools/minecraft-addon-toolchain/blob/master/packages/minecraft-addon-toolchain-browserify/README.md) |
| minecraft-addon-toolchain-terser     | Adds support for minifying and obfuscating JavaScript when building `.mcpack` and `.mcaddon` files | [Terser Plugin read me](https://github.com/minecraft-addon-tools/minecraft-addon-toolchain/blob/master/packages/minecraft-addon-toolchain-terser/README.md)         |
