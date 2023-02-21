const {series, watch, src, dest, parallel} = require('gulp');
const pump = require('pump');

// gulp plugins and utils
const gulpClean = require('gulp-clean');
const sass = require('gulp-sass')(require('sass'));
const gulpTs = require('gulp-typescript');
const concat = require('gulp-concat');
const livereload = require('gulp-livereload');
const postcss = require('gulp-postcss');
const uglify = require('gulp-uglify');
const beeper = require('beeper');
const zip = require('gulp-zip');

// postcss plugins
const autoprefixer = require('autoprefixer');
const colorFunction = require('postcss-color-mod-function');
const cssnano = require('cssnano');
const easyImport = require('postcss-easy-import');

const filePath = {
    built: 'assets/built/*',
    scss: 'assets/scss/styles.scss',
    css: [
        'assets/css/styles.css',
        ],
    ts: 'assets/ts/**/*.ts',
    js: [
        'node_modules/@tryghost/shared-theme-assets/assets/js/v1/lib/**/*.js',
        'node_modules/@tryghost/shared-theme-assets/assets/js/v1/main.js',
        'assets/js/**/*.js'
        ],
    json: 'locales/**/*.json',
    hbs: ['*.hbs', 'partials/**/*.hbs'],
    zip: [
        '**',
        '!assets/ts/**', '!assets/js/**', '!assets/sass/**', '!assets/css/**',
        '!node_modules', '!node_modules/**',
        '!dist', '!dist/**'
    ]
}

const destPath = {
    scss: 'assets/css/',
    css: 'assets/built/',
    ts: 'assets/js/',
    js: 'assets/built/'
}

function serve(done) {
    livereload.listen();
    done();
}

const handleError = (done) => {
    return function (err) {
        if (err) {
            beeper().then(_ => null);
        }
        return done(err);
    };
};

function clean(done) {
    pump([
        src(filePath.built),
        gulpClean()
    ], handleError(done));
}

function hbs(done) {
    pump([
        src(filePath.hbs),
        livereload()
    ], handleError(done));
}

function json(done) {
    pump([
        src(filePath.json),
        livereload()
    ], handleError(done));
}

function scss(done) {
    pump([
        src(filePath.scss),
        sass({
                includePaths: ['node_modules']
            },
            {}),
        dest(destPath.scss),
    ], handleError(done));
}

function css(done) {
    const processors = [
        easyImport,
        colorFunction,
        autoprefixer(),
        cssnano()
    ];

    pump([
        src(filePath.css, {sourcemaps: true}),
        postcss(processors),
        dest(destPath.css, {sourcemaps: '.'}),
        livereload()
    ], handleError(done));
}

function ts(done) {
    pump([
        src(filePath.ts),
        gulpTs({
            target: "es5",
            sourceMap: true,
            noImplicitAny: true,
            outFile: 'ts-all.js'
        }),
        dest(destPath.ts)
    ], handleError(done));
}

function js(done) {
    pump([
        src(filePath.js, {sourcemaps: true}),
        concat("main.min.js"),
        uglify(),
        dest(destPath.js, {sourcemaps: '.'}),
        livereload()
    ], handleError(done));
}

function zipper(done) {
    const targetDir = 'dist/';
    const themeName = require('./package.json').name;
    const filename = themeName + '.zip';

    pump([
        src(filePath.zip),
        zip(filename),
        dest(targetDir)
    ], handleError(done));
}

const scssWatcher = () => watch(filePath.scss, scss);
const cssWatcher = () => watch(filePath.css, css);
const tsWatcher = () => watch(filePath.ts, ts);
const jsWatcher = () => watch(filePath.js, js);
const jsonWatcher = () => watch(filePath.json, json);
const hbsWatcher = () => watch(filePath.hbs, hbs);

const watcher = parallel(scssWatcher, cssWatcher, tsWatcher, jsWatcher, jsonWatcher, hbsWatcher);
const build = series(clean, scss, css, ts, js);
const dev = series(build, serve, watcher);

exports.build = build;
exports.zip = series(build, zipper);
exports.default = dev;
