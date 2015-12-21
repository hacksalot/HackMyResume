
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

    function genTheme( themeName ) {
      it( themeName.toUpperCase() + ' theme should generate without throwing an exception', function () {
        function tryOpen() {
          var src = ['node_modules/jane-q-fullstacker/resume/jane-resume.json'];
          var dst = ['tests/sandbox/' + themeName + '/resume.all'];
          var opts = {
            theme: themeName,
            format: 'FRESH',
            prettify: true,
            silent: true
          };
          FCMD.verbs.build( src, dst, opts, function() { } );
        }
        tryOpen.should.not.Throw();
      });
    }

    genTheme('hello-world');
    genTheme('compact');
    genTheme('modern');
    genTheme('minimist');
    genTheme('awesome');
    genTheme('positive');

});
