const {series, parallel, src, dest, watch} = require("gulp");
const path = require("path");
const fs = require("fs");

class MinecraftModBuilder {
    constructor(modName, outDir) {
        this._modName = modName;
        this._outDir = outDir || "./built";
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
    }

    scripts(srcPath, additionalActions) {
        srcPath = srcPath || "./src/scripts/"

        let stream = src(path.join(srcPath, "*/*"))
        for (const action of toArray(additionalActions)) {
            stream = stream.pipe(action());
        }        
        return stream.pipe(dest(path.join(this._outDir, "behavior/scripts")));
    }

    behavior(srcPath, additionalActions) {
        srcPath = srcPath || "./src/behavior"

        let stream = src(path.join(srcPath, "**/*"))
        for (const action of toArray(additionalActions)) {
            stream = stream.pipe(action);
        }        
        return stream.pipe(dest(path.join(this._outDir, "behavior")));
    }

    resources(srcPath, additionalActions) {
        srcPath = srcPath || "./src/resources"

        let stream = src(path.join(srcPath, "**/*"))
        for (const action of toArray(additionalActions)) {
            stream = stream.pipe(action);
        }        
        return stream.pipe(dest(path.join(this._outDir, "resources")));
    }

    installBehavior(additionalActions) {
        let stream = src(path.join(this._outDir, "behavior/**/*"))
        for (const action of toArray(additionalActions)) {
            stream = stream.pipe(action);
        }        
        const destination = path.join(this._destRoot, "development_behavior_packs", this._modName);
        console.log(destination);
        return stream.pipe(dest(destination));
    }

    installResources(additionalActions) {
        let stream = src(path.join(this._outDir, "resource/**/*"))
        for (const action of toArray(additionalActions)) {
            stream = stream.pipe(action);
        }        
        return stream.pipe(dest(path.join(this._destRoot, "development_resource_packs", this._modName)));
    }

    configureEverythingForMe() {
        const builder = this;
        const tasks = {};

        tasks.scripts = function buildScripts() {
            return builder.scripts(null, builder.scriptTasks);
        };

        tasks.behavior = function buildBehavior() {
            return builder.behavior(null, builder.behaviorTasks);
        };

        tasks.resources = function buildResources() {
            return builder.resources(null, builder.resourcesTasks);
        };

        const verifyMinecraftExists = function verifyMinecraftExists(cb) {
            fs.stat(this._destRoot, (err, stats) => {
                if (!!err) {
                    cb(new Error("Minecraft Windows 10 edition is not installed"))
                }
                cb();
            });
        }

        tasks.install_behaviour = series(
            verifyMinecraftExists,
            function installBehavior() {
                return builder.installBehavior(builder.installBehaviorTasks);
            }
        );

        tasks.install_resources = series(
            verifyMinecraftExists,
            function installResources() {
                return builder.installBehavior(builder.installResourcesTasks);
            }
        );

        tasks.build = parallel(
            tasks.scripts, 
            tasks.behavior, 
            tasks.resources
        );
        

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

module.exports = MinecraftModBuilder;