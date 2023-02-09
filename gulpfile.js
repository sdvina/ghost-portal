const {series, watch, src, dest, parallel} = require('gulp');
const pump = require('pump');

// gulp plugins and utils
const gulpLess = require('gulp-less');
const concat = require('gulp-concat');
const livereload = require('gulp-livereload');
const postcss = require('gulp-postcss');
const zip = require('gulp-zip');
const uglify = require('gulp-uglify');
const beeper = require('beeper');

// postcss plugins
const autoprefixer = require('autoprefixer');
const colorFunction = require('postcss-color-mod-function');
const cssnano = require('cssnano');
const easyImport = require('postcss-easy-import');

const filePath = {
    less: 'assets/less/*.less',
    css: 'assets/css/*.css',
    js: 'assets/js/*.js',
    json: 'locales/*.json',
    hbs: ['*.hbs', '**/**/*.hbs', '!node_modules/**/*.hbs'],
    zip: [
        '**',
        '!node_modules', '!node_modules/**',
        '!dist', '!dist/**'
    ]
}

const destPath = {
    less: 'assets/css/',
    css: 'assets/css/',
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

function less(done) {
    pump([
        src(filePath.less),
        concat('less-all.less'),
        gulpLess(),
        dest(destPath.less),
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
        concat('all-min.css'),
        postcss(processors),
        dest(destPath.css, {sourcemaps: '.'}),
        livereload()
    ], handleError(done));
}

function js(done) {
    pump([
        src(filePath.js, {sourcemaps: true}),
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
const lessWatcher = () => watch(filePath.less, less);
const cssWatcher = () => watch(filePath.css, css);
const jsonWatcher = () => watch(filePath.json, json);
const hbsWatcher = () => watch(filePath.hbs, hbs);
const watcher = parallel(lessWatcher, cssWatcher, jsonWatcher, hbsWatcher);
const build = series(css, js);
const dev = series(build, serve, watcher);

exports.build = build;
exports.zip = series(build, zipper);
exports.default = dev;
