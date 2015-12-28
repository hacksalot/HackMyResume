module.exports = function (grunt) {

  'use strict';

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
      all: { src: ['test/*.js'] }
    },

    clean: ['test/sandbox'],

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
    },

    jshint: {
      options: {
        laxcomma: true,
        expr: true
      },
      all: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js']
    }

  };

  grunt.initConfig( opts );

  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-contrib-yuidoc');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('test', 'Test the HackMyResume library.',
    function( config ) { grunt.task.run( ['clean','simplemocha:all'] ); });
  grunt.registerTask('document', 'Generate HackMyResume library documentation.',
    function( config ) { grunt.task.run( ['yuidoc'] ); });
  grunt.registerTask('default', [ 'jshint', 'test', 'yuidoc' ]);

};
