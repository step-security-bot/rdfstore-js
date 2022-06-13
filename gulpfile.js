var gulp = require('gulp');
var clean = require('gulp-clean');
var browserify = require('gulp-browserify');
var rename     = require('gulp-rename');
var closureCompiler = require('gulp-closure-compiler');
var source = require('vinyl-source-stream');
var jasmine = require('gulp-jasmine');
var PEG = require('pegjs');
var fs = require('fs');
var packageJson = require('./package.json');

gulp.task('clean-dist', function(){
    return gulp.src('dist', {read: false})
        .pipe(clean());
});

gulp.task('browserify', ['clean-dist'], function() {

    return gulp.src(['./src/store.js'])
        .pipe(browserify({
            standalone: 'rdfstore',
            exclude: ["sqlite3","indexeddb-js"]
        }))
        .pipe(rename('rdfstore.js'))
        .pipe(gulp.dest('./dist'));
});

gulp.task('minimize', [ 'browserify' ], function() {
    return gulp.src('dist/*.js')
        .pipe(closureCompiler({
            continueWithWarnings: true,
            compilerPath: './node_modules/google-closure-compiler/compiler.jar',
            fileName: 'dist/rdfstore_min.js',
            compilerFlags: {
                'language_in': 'ECMASCRIPT5'
                //'compilation_level': 'ADVANCED_OPTIMIZATIONS'
            }
        }))
        .pipe(gulp.dest("."));
});

gulp.task('performance',function(){
    require('./src/perftest/trees');
});

gulp.task('specs', function () {
    return gulp.src('./spec/*.js')
        .pipe(jasmine({includeStackTrace: true, verbose:true}));
});

gulp.task('parseGrammar', function(){
    fs.readFile('pegjs/sparql_query.grammar', 'utf8', function(err, grammar){
        if(err) {
            throw err;
        } else {
            var parser =  PEG.generate(grammar, {output: 'source'});
            //var parser =  PEG.buildParser(grammar, {output: 'source', optimize: 'size'});
            fs.unlinkSync('src/parser.js');
            fs.writeFileSync('src/parser.js',"module.exports = "+parser);
        }
    });
});

gulp.task('default', ['parseGrammar', 'specs']);
gulp.task('browser', ['parseGrammar','clean-dist','browserify','minimize']);
