"use strict";

const { series, parallel, src, dest, watch } = require("gulp");
const path = require("path");
const fs = require("fs");
const clean = require("gulp-clean");
const gulpIf = require("gulp-if");
const tap = require("gulp-tap");
const log = require("gulplog");
const pump = require("pump");
const os = require("os");
const exclude = require("gulp-ignore");
const normalize = require("normalize-path");
const zip = require("gulp-zip");

class MinecraftAddonBuilder {
    constructor (modName) {
        this._version = 2;
        this._modName = modName;
        /** @type IPlugin[] */
        this._plugins = [];

        this.platformRoot = null;
        this.gameStateDir = "games/com.mojang";

        // script task factories
        this.packs = [];

        this.bundleDir = "./out/bundled";
        this.packageDir = "./out/packaged";
        this.sourceDir = "./packs";
    }

    addPlugin(plugin) {
        this._plugins.push(plugin);
    }

    determineMinecraftDataDirectory (done) {
        if (this.gameDataDir) {
            done();
            return;
        }
        if (!this.platformRoot) {
            switch (os.platform()) {
            case "win32":
                this.platformRoot = path.join(
                    process.env["LOCALAPPDATA"],
                    "Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState"
                );
                break;
            case "linux":
                this.platformRoot = path.resolve("~/.local/share/mcpelauncher");
                break;
            case "darwin":
                this.platformRoot = path.resolve("~/Library/Application Support/mcpelauncher");
                break;
            case "android":
                this.platformRoot = path.resolve("~/storage/shared/");
                break;
            default:
                done(new Error("Unexpected platform, please set platformRoot manually"));
                return;
            }
        }

        if (!this.platformRoot) {
            done(new Error("Unable to determine platform data storage directory for minecraft"));
            return;
        }

        this.gameDataDir = path.join(this.platformRoot, this.gameStateDir);
        done();
    }

    verifyMinecraftDataDirExists (done) {
        fs.stat(this.gameDataDir, (err) => {
            if (err) {
                done(new Error("Minecraft Bedrock edition's data directory is not available: " + this.gameDataDir));
            }
            done();
        });
    }

    determinePackTypes(done) {
        this.packs.length = 0;
        pump(
            [
                src("**/manifest.json", {cwd: this.sourceDir}),
                tap(file => {
                    const manifest = JSON.parse(file.contents);
                    const pack = {
                        path: path.dirname(file.path),
                        relativePath: path.relative(this.sourceDir, path.dirname(file.path)),
                        name: "No name specified",
                        types: []
                    };
                    if (manifest && manifest.header) {
                        pack.name = manifest.header.name;
                    }
                    if (manifest && Array.isArray(manifest.modules)) {
                        for (const module of manifest.modules) {
                            if (module.type === "client_data" || module.type === "data") {
                                pack.types.push("behavior");
                            }
                            if (module.type === "resources") {
                                pack.types.push("resources");
                            }
                        }
                    }

                    if (pack.types.length > 0) {
                        this.packs.push(pack);
                    }
                })
            ],
            () => {
                done();
            }
        );
    }

    /**
     * 
     * @param {string | null} type optional, either "resources" or "behavior". defaults to both.
     * @param {*} action  the action to perform.
     * @param {*} done  a callback to denote when the operations are complete.
     */
    foreachPack(type, action, done) {
        if (typeof type === "function") {
            done = action;
            action = type;
            type = undefined;
        }
        let packs = [...this.packs];
        if (type) {
            packs = packs.filter(p => !type || p.types.some(t => t === type));
        }

        const tasks = packs.map(p => (taskDone) => {
            return action(p, taskDone); 
        });

        return series(
            series(...tasks),
            (seriesDone) => {
                seriesDone();
                done();
            }
        )();
    }

    getTasks(selector) {
        return this._plugins
            .map(plugin => selector(plugin) || [])
            .reduce((p, c) => p.concat(c), [])
            .map(action => {
                const actions = [
                    gulpIf(action.condition, action.task()),
                ];
                if (action.preventDefault) {
                    actions.push(exclude(action.condition));
                }
                return actions;
            }
            )
            .reduce((p, c) => p.concat(c), []);
    }

    cleanOutDir(done) {
        pump(
            [
                src(this.bundleDir, { read: false, allowEmpty: true }),
                clean()
            ],
            done
        );
    }

    source (done) {
        this.foreachPack(null, (pack, packDone) => {
            log.info(`build ${pack.name} - ${path.join(pack.relativePath, "./**/*")}`);
            
            return pump(
                [
                    src(path.join(pack.relativePath, "./**/*"), { cwd: this.sourceDir }),
                    ...this.getTasks((plugin) => plugin.sourceTasks),
                    // tap(file => {
                    //     log.info(file.path);
                    // }),
                    dest(this.bundleDir)
                ],
                packDone
            );
        },
        done);
    }

    cleanBehavior (done) {
        const destination = path.join(this.gameDataDir, "development_behavior_packs");
        pump(
            [
                src(destination, { read: false, allowEmpty: true }),
                clean( {force: true} )
            ],
            done
        );
    }

    installBehavior (done) {
        log.info("Installing behaviour packs");
        return this.foreachPack("behavior", (pack, packDone) => {
            const destination = path.join(this.gameDataDir, "development_behavior_packs");
            log.info(`\t${pack.name}`);
            pump(
                [
                    src("./**/*", { cwd: path.join(this.bundleDir, pack.relativePath) }),
                    tap(file => {
                        //We want to include the package name in the directory.
                        file.base = path.resolve(file.base, "..");
                    }),
                    ...this.getTasks((plugin) => plugin.installBehaviorTasks),
                    dest(destination)
                ],
                packDone
            );
        },
        done);

        
    }

    cleanResources (done) {
        const destination = path.join(this.gameDataDir, "development_resource_packs", this._modName);
        pump(
            [
                src(destination, { read: false, allowEmpty: true }),
                clean({ force: true })
            ],
            done
        );
    }

    installResources (done) {
        log.info("Installing resource packs");

        return this.foreachPack("resources", (pack, packDone) => {
            const destination = path.join(this.gameDataDir, "development_resource_packs");
            log.info(`\t${pack.name}`);
            pump(
                [
                    src("./**/*", { cwd: path.join(this.bundleDir, pack.relativePath) }),
                    tap(file => {
                        //We want to include the package name in the directory.
                        file.base = path.resolve(file.base, "..");
                    }),
                    ...this.getTasks((plugin) => plugin.installBehaviorTasks),
                    dest(destination)
                ],
                packDone
            );
        },
        done);
    }

    createMCPacks(done) {
        log.info("Creating .mcpack files");
        return this.foreachPack((pack, packDone) => {
            log.info(`\t${pack.name}`);
            pump(
                [
                    src("./**/*", { cwd: path.join(this.bundleDir, pack.relativePath) }),
                    tap(file => {
                        //We want to include the package name in the directory.
                        file.base = path.resolve(file.base, "..");
                    }),
                    ...this.getTasks((plugin) => plugin.createMCPackTasks),
                    zip(pack.name + ".mcpack"),
                    dest(this.packageDir)
                ],
                packDone
            );
        }, 
        done);
    }

    createMCAddon(done) {
        log.info("Creating .mcaddon");

        pump(
            [
                src("*.mcpack", { cwd: path.join(this.packageDir) }),
                ...this.getTasks((plugin) => plugin.createMCAddOnTasks),
                zip(this._modName + ".mcaddon"),
                dest(this.packageDir)
            ],
            done
        );
    }

    configureEverythingForMe () {
        const builder = this;
        const tasks = {};
        tasks.clean = function clean (done) {
            return builder.cleanOutDir(done);
        };

        tasks.verifyMinecraftDataDirExists = series(
            function determineMinecraftDataDirectory (done) {
                return builder.determineMinecraftDataDirectory(done);
            },
            function verifyMinecraftDataDirExists (done) {
                return builder.verifyMinecraftDataDirExists(done);
            }
        );

        tasks.installBehaviour = series(
            tasks.verifyMinecraftDataDirExists,
            function cleanBehavior (done) {
                return builder.cleanBehavior(done);
            },
            function installBehavior (done) {
                return builder.installBehavior(done);
            }
        );

        tasks.installResources = series(
            tasks.verifyMinecraftDataDirExists,
            function cleanResources (done) {
                return builder.cleanResources(done);
            },
            function installResources (done) {
                return builder.installResources(done);
            }
        );

        tasks.determinePackTypes = function determinePackTypes (done) {
            return builder.determinePackTypes(done);
        };

        tasks.buildSource = function buildSource(done) {
            return builder.source(done);
        };

        tasks.build = series(
            tasks.determinePackTypes,
            tasks.buildSource
        );

        this._plugins.forEach(plugin => plugin.addDefaultTasks && plugin.addDefaultTasks(tasks));

        tasks.rebuild = series(
            tasks.clean,
            tasks.build
        );

        tasks.package = series(
            tasks.rebuild,
            function createMCPacks(done) {
                return builder.createMCPacks(done);
            },
            function createMCAddon(done) {
                return builder.createMCAddon(done);
            }
        );

        tasks.install = series(
            tasks.determinePackTypes,
            tasks.build,
            parallel(
                tasks.installBehaviour,
                tasks.installResources
            )
        );

        tasks.default = series(tasks.install);

        const notify = function notify (done) {
            log.info("File Changed\n");
            done();
        };

        tasks.watchLoop = series(
            notify,
            tasks.install
        );

        function watchFiles () {
            // normalize paths to posix format because globbing doesn't work with windows paths.
            // unfortunately path.join and path.resolve both change the path to windows format.
            const watchPath = normalize(path.join(path.resolve(builder.sourceDir), "**/*"));
            return watch(watchPath, tasks.watchLoop);
        }

        tasks.watch = series(
            tasks.clean,
            tasks.watchLoop,
            watchFiles
        );

        return tasks;
    }
}

module.exports = MinecraftAddonBuilder;
