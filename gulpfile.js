const { src, dest, watch, parallel } = require('gulp'),
	plumber = require('gulp-plumber'),
	notify = require('gulp-notify'),
	imagemin = require('gulp-imagemin'),
	mozjpeg = require('imagemin-mozjpeg'),
	pngquant = require('imagemin-pngquant'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	pug = require('gulp-pug'),
	sass = require('gulp-sass'),
	sassGlob = require('gulp-sass-glob'),
	postcss = require('gulp-postcss'),
	sorter = require('css-declaration-sorter'),
	mqpacker = require('css-mqpacker'),
	autoprefixer = require('autoprefixer'),
	rename = require('gulp-rename'),
	cleanCSS = require('gulp-clean-css'),
	babel = require('gulp-babel');

// CSSオプション
const plugin = [
	autoprefixer({ cascade: false }),
	sorter({ order: 'smacss' }),
	mqpacker()
];

// 画像圧縮オプション
const imageminOption = [
	pngquant({ quality: [0.8, 1] }),
	mozjpeg({ quality: 90 }),
	imagemin.gifsicle({
		interlaced: false,
		optimizationLevel: 5,
		colors: 256
	}),
	imagemin.jpegtran(),
	imagemin.optipng(),
	imagemin.svgo({
		plugins: [{ removeViewBox: false },
		{ cleanupIDs: false }]
	})];

// HTMLコンパイル
function html() {
	return src('src/views/*.pug')
		.pipe(pug({
			basedir: 'public/',
			pretty: true
		}))
		.pipe(dest('public/'));
}


// CSSコンパイル
function css() {
	return src('src/scss/**/*.scss')
		.pipe(plumber({
			errorHandler: notify.onError("Error: <%= error.message %>")
		}))
		.pipe(sassGlob())
		.pipe(sass({ outputStyle: 'expanded' }))
		.pipe(postcss(plugin))
		.pipe(dest('public/css'));
};

// JSコンパイル
function js() {
	return src(['src/**/*.js'])
		.pipe(concat('index.js'))
		.pipe(babel({
			presets: ['@babel/preset-env']
		}))
		.pipe(dest('public/scripts'));
}

// 画像コピー
function copy() {
	return src('src/images/*')
		.pipe(dest('public/images'));
};

// 画像圧縮
function imageminify() {
	return src(['src/images/*'])
		.pipe(imagemin(imageminOption))
		.pipe(dest('public/images'));
};

// CSS圧縮
function mincss() {
	return src(['public/css/*.css', '!public/css/*.min.css'])
		.pipe(cleanCSS())
		.pipe(rename({ suffix: '.min' }))
		.pipe(dest('public/css'))
};

// JS圧縮
function minjs () {
	return src(['public/js/*.js', '!public/js/script.min.js'])
		.pipe(uglify())
		.pipe(rename({ suffix: '.min' }))
		.pipe(dest('public/js'));
};

// ファイルチェック開始
exports.default = function () {
	watch(['src/views/**/*.pug'], html);
	watch(['src/scss/**/*.scss'], css);
	watch(['src/**/*.js'], js);
	watch(['src/images/*'], copy);
};

// 圧縮実行
exports.minify = parallel(imageminify, minjs, mincss);