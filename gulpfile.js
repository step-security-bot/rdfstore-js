var gulp = require('gulp');
var clean = require('gulp-clean');
var browserify = require('browserify');
var minify = require('gulp-minify');
var source = require('vinyl-source-stream');
var jasmine = require('gulp-jasmine');
var PEG = require('pegjs');
var fs = require('fs');

gulp.task('clean-dist', function(){
    return gulp.src('dist', {read: false})
        .pipe(clean());
});

gulp.task('browserify', ['clean-dist'], function() {
    return browserify('./src/store.js',{
            standalone: 'rdfstore',
            exclude: ["sqlite3","indexeddb-js"]
        })
        .bundle()
        .on('error', function(err) {
            console.log("Error : " + err.message)
        })
        .pipe(source('rdfstore.js'))
        .pipe(gulp.dest('./dist'));
});

gulp.task('minimize', [ 'browserify' ], function() {
    return gulp.src('dist/*.js')
        .pipe(minify({
            ext: {
                min: '_min.js'
            }
        }))
        .pipe(gulp.dest("dist"));
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
