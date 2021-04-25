const program = require('commander');
const express = require('express');
const path = require('path');
const browserSync = require('browser-sync').create();

const gulp = require('gulp');

const gutil = require('gulp-util');
const lintHTML = require('gulp-htmllint');
const lintCSS = require('gulp-stylelint');
const lintJS = require('gulp-eslint');
const deleteFiles = require('gulp-rimraf');
const minifyHTML = require('gulp-minify-html');
const minifyCSS = require('gulp-clean-css');
const minifyJS = require('gulp-terser');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const replaceHTML = require('gulp-html-replace');
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');
const imageminOptipng = require('imagemin-optipng');
const mozjpeg = require('imagemin-mozjpeg');
const zip = require('gulp-zip');
const advzip = require('gulp-advzip');
const checkFileSize = require('gulp-check-filesize');

var prod = !!program.prod;

const paths = {
    src: {
        html: './src/*.html',
        css: './src/css/*.css',
        js: './src/js/*.js',
        jsLibs: './src/js-libs/*.js',
        images: './src/images/*.png'
    },
    dist: {
        dir: './dist',
        html: './dist/',
        css: './dist/css/',
        js: './dist/js/',
        jsLibs: './dist/js-libs/',
        images: './dist/images/'
    }
};

gulp.task('lintHTML', () => {
    return gulp.src('src/**.html')
        .pipe(lintHTML());
});

gulp.task('lintCSS', () => {
    return gulp.src(paths.src.css)
        .pipe(lintCSS({
            reporters: [{ formatter: 'string', console: true }]
        }));
});

gulp.task('lintJS', () => {
    return gulp.src(paths.src.js)
        .pipe(lintJS())
        .pipe(lintJS.failAfterError());
});

gulp.task('cleanDist', () => {
    return gulp.src('dist/', { read: false, allowEmpty: true })
        .pipe(deleteFiles());
});

gulp.task('buildHTML', () => {
    return gulp.src(paths.src.html)
        .pipe(minifyHTML())
        .pipe(gulp.dest(paths.dist.html));
});

gulp.task('buildCSS', () => {
    return gulp.src(paths.src.css)
        .pipe(minifyCSS())
        .pipe(gulp.dest(paths.dist.css));
});

gulp.task('buildJSLibs', () => {
    return gulp.src(paths.src.jsLibs)
        .pipe(gulp.dest(paths.dist.jsLibs));
});

gulp.task('buildJS', () => {
    return gulp.src(paths.src.js)
        //.pipe(minifyJS())
        .pipe(gulp.dest(paths.dist.js));
});

gulp.task('optimizeImages', () => {
    return gulp.src(paths.src.images)
        .pipe(imagemin({ progressive: true, 
            use:[
                imageminOptipng({
                    optimizationLevel: 7,
                    bitDepthReduction: true,
                    colorTypeReduction: true,
                    paletteReduction: true
                }),
            mozjpeg({quality: '70'})],
            verbose: true}))
        .pipe(gulp.dest(paths.dist.images));
});

gulp.task('zip', () => {
    gulp.src('zip/*')
        .pipe(deleteFiles());

    return gulp.src(`${paths.dist.dir}/**`)
        .pipe(zip('game.zip'))
        .pipe(advzip({
            optimizationLevel: 4,
            iterations: 10
        }))
        .pipe(gulp.dest('zip'))
});


function watch() {
    gulp.watch(paths.src.html, gulp.series('buildHTML'));
    gulp.watch(paths.src.css, gulp.series('buildCSS'));
    gulp.watch(paths.src.js, gulp.series('buildJS'));
    gulp.watch(paths.src.jsLibs, gulp.series('buildJSLibs'));
    gulp.watch(paths.src.images, gulp.series('optimizeImages'));
}

gulp.task('serve', function() {
    browserSync.init({
        server: "./dist"
        // or
        // proxy: 'yourserver.dev'
    });

    watch();
    gulp.watch('dist/*').on('change', browserSync.reload);
});

gulp.task('test', gulp.parallel(
    'lintHTML',
    'lintCSS',
    'lintJS'
));

gulp.task('build', gulp.series(
    'cleanDist',
    gulp.series('buildHTML', 'buildCSS', 'buildJSLibs', 'buildJS', 'optimizeImages'),
    'zip'
));

gulp.task('dist', function() {
    if (!prod) {
        gutil.log(gutil.colors.yellow('WARNING'), gutil.colors.gray('Missing flag --prod'));
        gutil.log(gutil.colors.yellow('WARNING'), gutil.colors.gray('You should generate production assets to lower the archive size'));
    }

    return gulp.series('cleanDist', gulp.series('buildHTML', 'buildCSS', 'buildJSLibs', 'buildJS', 'optimizeImages'), 'zip')
});

gulp.task('watch', watch);

gulp.task('default', gulp.series(
    'build',
    'watch'
));
