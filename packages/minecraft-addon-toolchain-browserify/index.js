/// <reference types="minecraft-addon-toolchain/v1" />
const { series, src, dest } = require("gulp");

const tap = require("gulp-tap");
const log = require("gulplog");
const pump = require("pump");
const path = require("path");
const browserify = require("browserify");

const babelify = require("babelify");
const commonJSModule = require("@babel/plugin-transform-modules-commonjs");

/**
 * @type{IPlugin}
 */
class BrowserifySupport {
    constructor() {
        this.browserifyOptions = {
            // debug: true,
        };
        
        this.babelOptions = {
            plugins: [
                commonJSModule
            ],
            retainLines: true,
            compact: false
        };
        this.intermediateDir = "./out/before-browserify";
        this.entryPoints = ["./scripts/client/*.js", "./scripts/server/*.js"];

        const _this = this;
        this.sourceTasks = [
            {
                condition: "**/*.js",
                preventDefault: true,
                task: () => tap((file, t) => {
                    _this.browserifyOptions && _this.browserifyOptions.debug && log.info(`\tBrowserify: redirecting ${file.path}`);
                    return t.through(dest, [this.intermediateDir]);
                })
            }
        ];
    }

    set builder(builder) {
        if (builder._version < 1) {
            throw new Error("browserify support requires using a minecraft-addon-toolchain with at least version 2 or higher");
        }
        this._builder = builder;
    }

    addDefaultTasks(gulpTasks) {
        const _this = this;
        gulpTasks.build = series(
            gulpTasks.build,
            function browserify (done) {
                return _this._browserify(_this._builder, done);
            }
        );
    }

    _browserify (builder, done) {
        return builder.foreachPack("behavior", 
            (pack, packDone) => {
                log.info(`browserify ${pack.name}`);
                const packDir = path.join(this.intermediateDir, pack.relativePath);
                const destination = path.join(builder.bundleDir, pack.relativePath);
                return pump(
                    [
                        src(this.entryPoints, { cwd: packDir, read: false }),
                        tap(file => {
                            this.browserifyOptions && this.browserifyOptions.debug && log.info(`\tbundling ${path.relative(packDir, file.path)}`);
                            file.base = path.resolve(packDir);
                            file.contents = browserify(file.path, this.browserifyOptions)
                                .transform(babelify, this.babelOptions)
                                .bundle();
                        }),
                        dest(destination)
                    ],
                    packDone
                );
            },
            done
        );
    }
}

module.exports = BrowserifySupport;