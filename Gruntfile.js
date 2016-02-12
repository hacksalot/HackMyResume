module.exports = function (grunt) {

  'use strict';

  var opts = {

    pkg: grunt.file.readJSON('package.json'),

    copy: {
      main: {
        expand: true,
        cwd: 'src',
        src: ['**/*','!**/*.coffee'],
        dest: 'dist/',
      }
    },

    coffee: {
      main: {
        options: {
          sourceMap: true
        },
        expand: true,
        cwd: 'src',
        src: ['**/*.coffee'],
        dest: 'dist/',
        ext: '.js'
      }
    },

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

    jsdoc : {
      dist : {
        src: ['src/**/*.js'],
        options: {
          private: true,
          destination: 'doc'
        }
      }
    },

    clean: {
      test: ['test/sandbox'],
      dist: ['dist']
    },

    yuidoc: {
      compile: {
        name: '<%= pkg.name %>',
        description: '<%= pkg.description %>',
        version: '<%= pkg.version %>',
        url: '<%= pkg.homepage %>',
        options: {
          paths: 'src/',
          outdir: 'docs/'
        }
      }
    },

    jshint: {
      options: {
        laxcomma: true,
        expr: true,
        eqnull: true
      },
      all: ['Gruntfile.js', 'dist/cli/**/*.js', 'test/*.js']
    }

  };

  grunt.initConfig( opts );
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-contrib-yuidoc');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // Use 'grunt test' for local testing
  grunt.registerTask('test', 'Test the HackMyResume application.',
    function( config ) {
      grunt.task.run(['clean:test','build','jshint','simplemocha:all']);
    });

  // Use 'grunt document' to build docs
  grunt.registerTask('document', 'Generate HackMyResume documentation.',
    function( config ) {
      grunt.task.run( ['jsdoc'] );
    });

  // Use 'grunt build' to build HMR
  grunt.registerTask('build', 'Build the HackMyResume application.',
    function( config ) {
      grunt.task.run( ['clean:dist','copy','coffee'] );
    });

  // Default task does everything
  grunt.registerTask('default', [ 'test', 'document' ]);

};
