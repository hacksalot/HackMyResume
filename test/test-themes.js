
var chai = require('chai')
  , expect = chai.expect
  , should = chai.should()
  , path = require('path')
  , _ = require('underscore')
	, FRESHResume = require('../src/core/fresh-resume')
  , FCMD = require( '../src/hackmycmd')
  , validator = require('is-my-json-valid')
  , COLORS = require('colors');

chai.config.includeStack = false;

describe('Testing themes', function () {

    var _sheet;

    COLORS.setTheme({
      title: ['white','bold'],
      info: process.platform === 'win32' ? 'gray' : ['white','dim'],
      infoBold: ['white','dim'],
      warn: 'yellow',
      error: 'red',
      guide: 'yellow',
      status: 'gray',//['white','dim'],
      useful: 'green',
    });

    function genTheme( fmt, src, themeName, themeLoc, testTitle ) {
      themeLoc = themeLoc || themeName;
      testTitle = themeName.toUpperCase() + ' theme should generate without throwing an exception';
      it( testTitle, function () {
        function tryOpen() {
          //var src = ['node_modules/jane-q-fullstacker/resume/jane-resume.json'];
          var dst = ['test/sandbox/' + fmt + '/' +  themeName + '/resume.all'];
          var opts = {
            theme: themeLoc,
            format: fmt,
            prettify: true,
            silent: true
          };
          FCMD.verbs.build( src, dst, opts, function() {} );
        }
        tryOpen.should.not.Throw();
      });
    }

    var src = ['node_modules/jane-q-fullstacker/resume/jane-resume.json'];
    genTheme('FRESH', src, 'hello-world');
    genTheme('FRESH', src, 'compact');
    genTheme('FRESH', src, 'modern');
    genTheme('FRESH', src, 'minimist');
    genTheme('FRESH', src, 'awesome');
    genTheme('FRESH', src, 'positive');
    genTheme('FRESH', src, 'jsonresume-theme-boilerplate', 'node_modules/jsonresume-theme-boilerplate' );
    genTheme('FRESH', src, 'jsonresume-theme-sceptile', 'node_modules/jsonresume-theme-sceptile' );
    genTheme('FRESH', src, 'jsonresume-theme-modern', 'node_modules/jsonresume-theme-modern' );
    genTheme('FRESH', src, 'jsonresume-theme-classy', 'node_modules/jsonresume-theme-classy' );

    src = ['test/resumes/jrs-0.0.0/richard-hendriks.json'];
    genTheme('JRS', src, 'hello-world');
    genTheme('JRS', src, 'compact');
    genTheme('JRS', src, 'modern');
    genTheme('JRS', src, 'minimist');
    genTheme('JRS', src, 'awesome');
    genTheme('JRS', src, 'positive');
    genTheme('JRS', src, 'jsonresume-theme-boilerplate', 'node_modules/jsonresume-theme-boilerplate' );    
    genTheme('JRS', src, 'jsonresume-theme-sceptile', 'node_modules/jsonresume-theme-sceptile' );
    genTheme('JRS', src, 'jsonresume-theme-modern', 'node_modules/jsonresume-theme-modern' );
    genTheme('JRS', src, 'jsonresume-theme-classy', 'node_modules/jsonresume-theme-classy' );

});
