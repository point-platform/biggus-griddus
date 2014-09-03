var gulp = require('gulp');
var typescript = require('gulp-tsc');

gulp.task('default', function()
{
  // place code for your default task here
});

gulp.task('compile', function()
{
  gulp.src(['**/*.ts'])
    .pipe(typescript({ sourcemap: true, module: "amd" }))
    .pipe(gulp.dest('out/'));
});
