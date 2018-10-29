const {series, parallel, src, dest, watch} = require("gulp");
const path = require("path");
const fs = require("fs");
const clean = require("gulp-clean");
class MinecraftModBuilder {
    constructor(modName) {
        this._modName = modName;
        this._destRoot = path.join(
            process.env["LOCALAPPDATA"],
            "Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang"
        );

        //script task factories
        this.scriptTasks = []; 
        this.behaviorTasks = [];     
        this.resourcesTasks = [];
        this.installBehaviorTasks = [];
        this.installResourcesTasks = [];

        this.outDir = "./built"
        this.scriptsDir = "./src/scripts/"
        this.behaviorDir = "./src/behavior/"
        this.resourcesDir = "./src/resources/"
    }

    verifyMinecraftExists(cb) {
        fs.stat(this._destRoot, (err) => {
            if (!!err) {
                cb(new Error("Minecraft Windows 10 edition is not installed"))
            }
            cb();
        });
    }

    cleanOutDir() {
        return src(this.outDir, { read: false, allowEmpty: true }).pipe(clean());
    }

    scripts() {
        let stream = src("*/*", {cwd: this.scriptsDir})
        stream = augmentPipe(stream, this.scriptTasks);
        return stream.pipe(dest(path.join(this.outDir, "behavior/scripts")));
    }

    behavior() {
        let stream = src("**/*", { cwd: this.behaviorDir })
        stream = augmentPipe(stream, this.behaviorTasks);
        return stream.pipe(dest(path.join(this.outDir, "behavior")));
    }

    resources() {
        let stream = src("**/*", { cwd: this.resourcesDir })
        stream = augmentPipe(stream, this.resourcesTasks);
        return stream.pipe(dest(path.join(this.outDir, "resources")));
    }

    cleanBehavior() {
        const destination = path.join(this._destRoot, "development_behavior_packs", this._modName);
        return src(destination, { read: false, allowEmpty: true }).pipe(clean({force: true}));
    }

    installBehavior() {
        let stream = src("**/*", {cwd: path.join(this.outDir, "behavior")})
        stream = augmentPipe(stream, this.installBehaviorTasks);
        const destination = path.join(this._destRoot, "development_behavior_packs", this._modName);
        return stream.pipe(dest(destination));
    }

    cleanResources() {
        const destination = path.join(this._destRoot, "development_resource_packs", this._modName);
        return src(destination, { read: false, allowEmpty: true }).pipe(clean({force: true}));
    }

    installResources() {
        let stream = src("**/*", {cwd: path.join(this.outDir, "resource")})
        stream = augmentPipe(stream, this.installResourcesTasks);
        return stream.pipe(dest(path.join(this._destRoot, "development_resource_packs", this._modName)));
    }

    configureEverythingForMe() {
        const builder = this;
        const tasks = {};

        tasks.scripts = function buildScripts() {
            return builder.scripts();
        };

        tasks.behavior = function buildBehavior() {
            return builder.behavior();
        };

        tasks.resources = function buildResources() {
            return builder.resources();
        };

        tasks.verifyMinecraftExists = function verifyMinecraftExists(cb) {
            return builder.verifyMinecraftExists(cb);
        }

        tasks.install_behaviour = series(
            tasks.verifyMinecraftExists,
            function cleanBehavior() {
                return builder.cleanBehavior();
            },
            function installBehavior() {
                return builder.installBehavior();
            }
        );

        tasks.install_resources = series(
            tasks.verifyMinecraftExists,
            function cleanResources() {
                return builder.cleanResources();
            },
            function installResources() {
                return builder.installResources();
            }
        );

        tasks.build = parallel(
            tasks.scripts, 
            tasks.behavior, 
            tasks.resources
        );
        
        tasks.rebuild = series(
            function clean() {
                return builder.cleanOutDir();
            },
            tasks.build            
        )

        tasks.install = series(
            tasks.build,
            parallel(
                tasks.install_behaviour,
                tasks.install_resources
            )
        );        

        tasks.default = series(tasks.install);

        function watchForUnlink(watcher) {
            return watcher.on('unlink', function (filepath) {
                var filePathFromSrc = path.relative(path.resolve('src'), filepath);
                // Concatenating the 'build' absolute path used by gulp.dest in the scripts task
                var destFilePath = path.resolve('build', filePathFromSrc);
                del.sync(destFilePath);
            });
        }

        const notify = function notify(cb) {
            console.log("File Changed\n");
            cb();
        }

        function watchFiles() {
            watchForUnlink(watch('src/scripts/**/*', series(notify, tasks.scripts, tasks.install_behaviour)));
            watchForUnlink(watch('src/behavior/**/*', series(notify, tasks.behavior, tasks.install_behaviour)));
            watchForUnlink(watch('src/resources/**/*', series(notify, tasks.resources, tasks.install_resources)));
        }

        tasks.watch = series(
            tasks.install,
            watchFiles
        )

        return tasks;
    }
}

function toArray(collection, options) {
    if (typeof collection === 'string') return (options && options.query ? toArray(document.querySelectorAll(collection)) : [collection])
    if (typeof collection === 'undefined') return []
    if (collection === null) return [null]
    if (typeof window != 'undefined' && collection === window) return [window]
    if (Array.isArray(collection)) return collection.slice()
    if (typeof collection.length != 'number') return [collection]
    if (typeof collection === 'function') return [collection]
    if (collection.length === 0) return []
    var arr = []
    for (var i = 0; i < collection.length; i++) {
      if (collection.hasOwnProperty(i) || i in collection) {
        arr.push(collection[i])
      }
    }
    if (arr.length === 0) return [collection]
    return arr
}

function augmentPipe(stream, additionalActions) {
    for (const action of toArray(additionalActions)) {
        if (typeof action === "function") {
            stream = stream.pipe(action());
        } else {
            stream = stream.pipe(action);
        }
    }
    return stream;
}

module.exports = MinecraftModBuilder;