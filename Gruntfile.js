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
    }

  };

  grunt.initConfig( opts );
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.registerTask('test', 'Test the FluentLib library.', function( config ) {
    grunt.task.run( ['simplemocha:all'] );
  });
  grunt.registerTask('default', [ 'test' ]);

};
