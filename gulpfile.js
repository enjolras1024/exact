var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var replace = require('gulp-replace');

var files = [
  'src/entry',

  // utils
  'src/utils/PathUtil.js',
  'src/utils/StringUtil.js',
  'src/utils/LiteralUtil.js',

  // share
  'src/share/constants.js',
  'src/share/functions.js',
  'src/share/RES.js',
  //'src/share/Dep.js',

  // skins
  //'src/skins/Skin.js',
  //'src/skins/Skin-jQuery.js',
  //'src/skins/Skin-cheerio.js',

  // base modules
  'src/base/Watcher.js',
  'src/base/Accessor.js',
  'src/base/Schedule.js',
  'src/base/Validator.js',
  'src/base/Evaluator.js',
  'src/base/Expression.js',
  'src/base/DirtyMarker.js',

  // core modules
  'src/core/models/Collection.js',
  'src/core/models/Container.js',
  'src/core/models/Store.js',

  'src/core/shadows/Shadow.js',
  'src/core/shadows/Text.js',
  'src/core/shadows/Element.js',
  'src/core/shadows/Component.js',

  'src/core/bindings/Binding.js',
  'src/core/bindings/DataBinding.js',
  'src/core/bindings/TextBinding.js',
  'src/core/bindings/EventBinding.js',

  'src/core/template/HTMXEngine.js',
  'src/core/template/HTMXTemplate.js',
  'src/core/template/parsers/EvaluatorParser.js',
  'src/core/template/parsers/EventBindingParser.js',
  'src/core/template/parsers/DataBindingParser.js',
  'src/core/template/parsers/TextBindingParser.js',
  'src/core/template/parsers/HTMLParser.js',
  'src/core/template/parsers/HTMXParser.js',

  'src/more/updaters/HTMXUpdater.js',

  'src/exit'
];

gulp.task('build', function() {
  return gulp.src(files)
    .pipe(concat('exact.js'))
    .pipe(replace(/__DEV__/g, "development"))
    //.pipe(replace(/Exact.env/g, "<ES5"))
    .pipe(gulp.dest('./dist/'))
    .pipe(rename('exact.min.js'))
    .pipe(replace(/__DEV__/g, "production"))
    .pipe(uglify())
    .pipe(gulp.dest('./dist/'));
});

gulp.task('build-skin', function() {
  return gulp.src('./src/skins/Skin.js')
    .pipe(concat('exact-skin.js'))
    .pipe(gulp.dest('./dist/'))
    .pipe(rename('exact-skin.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./dist/'));
});

gulp.task('build-skin-jquery', function() {
  return gulp.src('./src/skins/Skin-jQuery.js')
    .pipe(concat('exact-skin-jquery.js'))
    .pipe(gulp.dest('./dist/'))
    .pipe(rename('exact-skin-jquery.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./dist/'));
});

gulp.task('build-skin-cheerio', function() {
  return gulp.src('./src/skins/Skin-cheerio.js')
    .pipe(concat('exact-skin-cheerio.js'))
    .pipe(gulp.dest('./dist/'))
    .pipe(rename('exact-skin-cheerio.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./dist/'));
});

//gulp.task('default',['build']);

//gulp.watch('src/**/*.js')