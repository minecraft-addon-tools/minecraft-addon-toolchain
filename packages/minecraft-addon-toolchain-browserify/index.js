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
        this.entryPoints = ["scripts/client/*.js", "scripts/server/*.js"];
        this.bundleSources = ["scripts/**/*.js" ];

        const _this = this;
        this.sourceTasks = [
            {
                condition: this.bundleSources,
                preventDefault: true,
                task: (pack) => tap((file, t) => {
                    _this.browserifyOptions && _this.browserifyOptions.debug && log.info(`\tBrowserify: redirecting ${file.path}`);
                    return t.through(dest, [path.join(this.intermediateDir, pack.relativePath)]);
                })
            }
        ];
    }

    set builder(builder) {
        if (builder._version < 1) {
            throw new Error("browserify support requires using a minecraft-addon-toolchain with at least version 1 or higher");
        }
        this._builder = builder;
    }

    addDefaultTasks(gulpTasks) {
        const browserify = this._browserify.bind(this);
        browserify.displayName = "browserify";

        gulpTasks.buildSource = series(
            gulpTasks.buildSource,
            browserify
        );
    }

    _browserify (done) {
        return this._builder.foreachPack(
            "browserify",
            "behavior", 
            (pack, packDone) => {
                const packDir = path.join(this.intermediateDir, pack.relativePath);
                const destination = path.join(this._builder.bundleDir, pack.relativePath);
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