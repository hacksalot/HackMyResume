'use strict';

module.exports = function (grunt) {

  var opts = {

    pkg: grunt.file.readJSON('package.json'),

    simplemocha: {
      options: {
        globals: ['expect', 'should'],
        timeout: 3000,
        ignoreLeaks: false,
        ui: 'bdd',
        reporter: 'spec'
      },
      all: { src: ['tests/*.js'] }
    },

    yuidoc: {
      compile: {
        name: '<%= pkg.name %>',
        description: '<%= pkg.description %>',
        version: '<%= pkg.version %>',
        url: '<%= pkg.homepage %>',
        options: {
          paths: 'src/',
          //themedir: 'path/to/custom/theme/',
          outdir: 'docs/'
        }
      }
    }

  };

  grunt.initConfig( opts );
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-contrib-yuidoc');
  grunt.registerTask('test', 'Test the FluentCV library.', function( config ) {
    grunt.task.run( ['simplemocha:all'] );
  });
  grunt.registerTask('document', 'Generate FluentCV library documentation.', function( config ) {
    grunt.task.run( ['yuidoc'] );
  });
  grunt.registerTask('default', [ 'test', 'yuidoc' ]);

};
