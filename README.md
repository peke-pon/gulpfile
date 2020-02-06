## 静的サイト用テンプレート【2020年度版】

gulpの設定をしようと検索をしたのですが、gulp3のバージョン違いの情報しか
見つからなかったので公式ドキュメントを元に基本的な機能を実装してみました。
(gulp.taskはv4で非推奨になっています)

## gulpのインストール

```bash
npm install gulp-cli -g
npm install gulp -D
npm install
```
## gulpコマンド

### Pug,Sass,JavaScript、画像コピー,ライブリロード

```
npx　gulp
```

### CSS圧縮,Javascript圧縮、画像圧縮

```
npx minify
```

### ①pug->html変換　

srcフォルダのview内のpugファイルを編集すると自動でコンパイル。
コンパイルされたhtmlはpublicフォルダへコピーされます。

### ②sass->css変換

srcフォルダのsass内のファイルを編集すると自動でコンパイル。
コンパイルされたcssはpublicフォルダへコピーされます。

### ③cssフォーマット

自動でcssのフォーマットをしてくれます。
cssプロパティの順番を入れ替えて、コードを整理します。
さらにautoplefixerでプレフィックスの付加をする。
(対応範囲はpackage.json内のbrowserslistで設定)

### ④JavaScriptファイル

JavaScriptを分割管理したものを結合してトランスパイルする。
さらに、圧縮してsrcフォルダのpublic/scriptsへコピーされます。

### ⑤画像圧縮

imageminでの圧縮。元ファイルを残すために、srcフォルダのimagesへ入れると
publicへコピーされるようになっています。圧縮コマンドを実行するとpublicフォルダ内の
画像が圧縮されます。画像のクオリティーはオプションを変更してください

### ⑥ライブリロード

browserSyncを使用してのライブリロード。
公式ドキュメントがgulp.taskだったのでfunctionへ変更。
普段live-serverを使用しているので、只今実験中です。

## gulpfile

```js
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
	babel = require('gulp-babel'),
	browserSync = require('browser-sync').create();

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
	return src(['src/views/**/*.pug', '!src/views/**/_*.pug'])
		.pipe(pug({
			basedir: 'public/',
			pretty: true
		}))
		.pipe(dest('public/'));
}

// CSSコンパイル
function css() {
	return src('src/scss/style.scss')
		.pipe(plumber({
			errorHandler: notify.onError("Error: <%= error.message %>")
		}))
		.pipe(sassGlob())
		.pipe(sass({ outputStyle: 'expanded' }))
		.pipe(postcss(plugin))
		.pipe(dest('public/css'));
};

// JSトランスパイル
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

// ブラウザ同期
function serve () {
	return browserSync.init({
		server: {
			baseDir: "./public/",
			index: 'index.html'
		}
	});
};

function reload () {
	browserSync.reload();
}

// ファイルチェック開始
exports.default = function () {
	watch(['src/views/**/*.pug'], html);
	watch(['src/scss/**/*.scss'], css).on("change", reload);
	watch(['src/scripts/**/*.js'], js).on("change", reload);
	watch(['src/images/*'], copy).on("change", reload);
	watch(["public/**/*.*"], serve).on("change", reload);
};

// 圧縮実行
exports.minify = parallel(imageminify, minjs, mincss);
```
