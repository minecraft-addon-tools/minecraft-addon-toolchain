/// <reference path="./index.d.ts" />
"use strict";

const {
    series,
    parallel,
    src,
    dest,
    watch
} = require("gulp");
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
const _ = require("lodash");
const fillTemplate = require("es6-dynamic-template");

class MinecraftAddonBuilder {
    constructor(modName) {
        this._version = 1;
        this._modName = modName;
        /** @type IPlugin[] */
        this._plugins = [];

        this.gameDataDir = process.env.BEDROCK_DATA_DIR || null;

        // script task factories
        /** @type IPack[] */
        this.packs = [];

        this.bundleDir = "./out/bundled";
        this.packageDir = "./out/packaged";
        this.sourceDir = "./packs";

        this.templateDirName = "${modName} - ${name}";
        this.templateMcPackName = "${modName} - ${name} - v${version}";
    }

    parseTemplate(template, pack, packType) {
        var templateVars = _.cloneDeep(pack);
        templateVars.packType = packType;
        templateVars.modName = this._modName;
        templateVars.type = undefined;
        templateVars.version = _.isArray(pack.version) ? `${pack.version[0]}.${pack.version[1]}.${pack.version[2]}` : "No version in manifest";
        return fillTemplate(template, templateVars);
    }

    addPlugin(plugin) {
        plugin.builder = this;
        this._plugins.push(plugin);
    }

    determineMinecraftDataDirectory(done) {
        if (this.gameDataDir) {
            done();
            return;
        }

        let platformRoot = null;
        switch (os.platform()) {
            case "win32":
                platformRoot = path.join(
                    process.env["LOCALAPPDATA"],
                    "Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState"
                );
                break;
            case "linux":
                platformRoot = path.join(os.homedir(), ".local/share/mcpelauncher");
                break;
            case "darwin":
                platformRoot = path.join(os.homedir(), "Library/Application Support/mcpelauncher");
                break;
            case "android":
                platformRoot = path.join(os.homedir(), "storage/shared/");
                break;
            default:
                done(new Error("Unknown platform, please set the BEDROCK_DATA_DIR environment variable"));
                return;
        }

        this.gameDataDir = path.join(platformRoot, "games/com.mojang");
        done();
    }

    verifyMinecraftDataDirExists(done) {
        fs.stat(this.gameDataDir, (err) => {
            if (err) {
                done(new Error("Minecraft Bedrock edition's data directory is not available: " + this.gameDataDir));
            }
            done();
        });
    }

    /**
     * 
     * @param {string} location 
     * @param {(packs: IPack[]) => any} done 
     */
    determinePacksInLocation(location, done) {
        /** {@type} IPack[] */
        const packs = [];
        pump(
            [
                src("*/manifest.json", {
                    cwd: location
                }),
                tap(file => {
                    const manifest = JSON.parse(file.contents);
                    /** {@type} IPack */
                    const pack = {
                        path: path.dirname(file.path),
                        relativePath: path.relative(location, path.dirname(file.path)),
                        name: "No name specified",
                        types: []
                    };
                    if (manifest && manifest.header) {
                        pack.name = manifest.header.name;
                        pack.uuid = manifest.header.uuid;
                        pack.version = manifest.header.version;
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
                        packs.push(pack);
                    }
                })
            ],
            () => {
                done(packs);
            }
        );
    }

    /**
     * 
     * @param {string | null} type optional, either "resources" or "behavior". defaults to both.
     * @param {(pack: IPack, callback: () => void)} action  the action to perform.
     * @param {() => void} done  a callback to denote when the operations are complete.
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

        if (tasks.length === 0) {
            log.error("No packs found");
            done();
            return;
        }

        return series(
            series(...tasks),
            (seriesDone) => {
                seriesDone();
                done();
            }
        )();
    }

    /**
     * 
     * @param {(plugin: IPlugin) => ITask[] | null} selector 
     * @returns {NodeJS.ReadWriteStream[]}
     */
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
            })
            .reduce((p, c) => p.concat(c), []);
    }

    determinePacks(done) {
        this.packs.length = 0;
        this.determinePacksInLocation(this.sourceDir, (packs) => {
            this.packs.push(...packs);
            done();
        });
    }

    cleanOutDir(done) {
        pump(
            [
                src([this.bundleDir, this.packageDir], {
                    read: false,
                    allowEmpty: true
                }),
                clean()
            ],
            done
        );
    }

    source(done) {
        this.foreachPack(null, 
            (pack, packDone) => {
                log.info(`build ${pack.name} - ${path.join(pack.relativePath, "./**/*")}`);

                return pump(
                    [
                        src(path.join(pack.relativePath, "./**/*"), {
                            cwd: this.sourceDir
                        }),
                        ...this.getTasks((plugin) => plugin.sourceTasks),
                        // tap(file => {
                        //     log.info(file.path);
                        // }),
                        dest(this.bundleDir)
                    ],
                    packDone
                );
            },
            done
        );
    }

    cleanBehavior(done) {
        log.info("Cleaning installed behaviour packs");
        const destination = path.join(this.gameDataDir, "development_behavior_packs");
        this.determinePacksInLocation(destination, (installedPacks) => {

            const packsToRemove = installedPacks
                .filter(ip => this.packs.find(p => p.uuid === ip.uuid))
                .map(ip => ip.relativePath);

            if (packsToRemove.length === 0) {
                done();
                return;
            }
            pump(
                [
                    src(packsToRemove, {
                        cwd: destination,
                        read: false,
                        allowEmpty: true
                    }),
                    tap(file => {
                        log.info(`\tRemoving behavior pack ${path.relative(destination, file.path)}`);
                    }),
                    clean({
                        force: true
                    })
                ],
                done
            );
        });
    }

    installBehavior(done) {
        log.info("Installing behaviour packs");
        return this.foreachPack("behavior",
            (pack, packDone) => {
                const packDir = this.parseTemplate(this.templateDirName, pack, "behavior");
                const destination = path.join(this.gameDataDir, "development_behavior_packs", packDir);
                log.info(`\t${pack.name}`);
                return pump(
                    [
                        src("./**/*", {
                            cwd: path.join(this.bundleDir, pack.relativePath)
                        }),
                        ...this.getTasks((plugin) => plugin.installBehaviorTasks),
                        dest(destination)
                    ],
                    packDone
                );
            },
            done);
    }

    cleanResources(done) {
        log.info("Cleaning installed resource packs");
        const destination = path.join(this.gameDataDir, "development_resource_packs");
        this.determinePacksInLocation(destination, (installedPacks) => {
            const packsToRemove = installedPacks.filter(ip => this.packs.find(p => p.uuid === ip.uuid))
                .map(ip => ip.relativePath);
            if (packsToRemove.length === 0) {
                done();
                return;
            }
            pump(
                [
                    src(packsToRemove, {
                        cwd: destination,
                        read: false,
                        allowEmpty: true
                    }),
                    tap(file => {
                        log.info(`\tRemoving resource pack ${path.relative(destination, file.path)}`);
                    }),
                    clean({
                        force: true
                    })
                ],
                done
            );
        });
    }

    installResources(done) {
        log.info("Installing resource packs");

        return this.foreachPack("resources",
            (pack, packDone) => {
                const packDir = this.parseTemplate(this.templateDirName, pack, "resources");
                const destination = path.join(this.gameDataDir, "development_resource_packs", packDir);
                log.info(`\t${pack.name}`);
                return pump(
                    [
                        src("./**/*", {
                            cwd: path.join(this.bundleDir, pack.relativePath)
                        }),
                        ...this.getTasks((plugin) => plugin.installResourceTasks),
                        dest(destination)
                    ],
                    packDone
                );
            },
            done);
    }

    createMCPacks(done) {
        log.info("Creating .mcpack files");
        return this.foreachPack(
            (pack, packDone) => {
                const packZip = this.parseTemplate(this.templateMcPackName, pack);
                log.info(`\t${pack.name}`);
                pump(
                    [
                        src("./**/*", {
                            cwd: path.join(this.bundleDir, pack.relativePath)
                        }),
                        tap(file => {
                            //We want to include the package name in the directory.
                            file.base = path.resolve(file.base, "..");
                        }),
                        ...this.getTasks((plugin) => plugin.createMCPackTasks),
                        zip(packZip + ".mcpack"),
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
                src("*.mcpack", {
                    cwd: path.join(this.packageDir)
                }),
                ...this.getTasks((plugin) => plugin.createMCAddOnTasks),
                zip(this._modName + ".mcaddon"),
                dest(this.packageDir)
            ],
            done
        );
    }

    configureEverythingForMe() {
        const builder = this;
        const tasks = {};
        tasks.clean = function clean(done) {
            return builder.cleanOutDir(done);
        };

        tasks.verifyMinecraftDataDirExists = series(
            function determineMinecraftDataDirectory(done) {
                return builder.determineMinecraftDataDirectory(done);
            },
            function verifyMinecraftDataDirExists(done) {
                return builder.verifyMinecraftDataDirExists(done);
            }
        );

        tasks.installBehaviour = series(
            tasks.verifyMinecraftDataDirExists,
            function cleanBehavior(done) {
                return builder.cleanBehavior(done);
            },
            function installBehavior(done) {
                return builder.installBehavior(done);
            }
        );

        tasks.installResources = series(
            tasks.verifyMinecraftDataDirExists,
            function cleanResources(done) {
                return builder.cleanResources(done);
            },
            function installResources(done) {
                return builder.installResources(done);
            }
        );

        tasks.determinePacks = function determinePacks(done) {
            return builder.determinePacks(done);
        };

        tasks.buildSource = function buildSource(done) {
            return builder.source(done);
        };

        tasks.build = series(
            tasks.determinePacks,
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
            tasks.determinePacks,
            tasks.build,
            parallel(
                tasks.installBehaviour,
                tasks.installResources
            )
        );

        tasks.uninstall = series(
            tasks.verifyMinecraftDataDirExists,
            parallel(
                function cleanResources(done) {
                    return builder.cleanResources(done);
                },
                function cleanBehavior(done) {
                    return builder.cleanBehavior(done);
                }
            )
        );

        tasks.default = series(tasks.install);

        const notify = function notify(done) {
            log.info("File Changed\n");
            done();
        };

        tasks.watchLoop = series(
            notify,
            tasks.install
        );

        function watchFiles() {
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