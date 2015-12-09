
var chai = require('chai')
  , expect = chai.expect
  , should = chai.should()
  , path = require('path')
  , _ = require('underscore')
	, FRESHResume = require('../src/core/fresh-resume')
  , FCMD = require( '../src/fluentcmd')
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

    it('HELLO-WORLD theme should generate without throwing an exception', function () {
      function tryOpen() {
        var src = ['node_modules/FRESCA/exemplar/jane-doe.json'];
        var dst = ['tests/sandbox/hello-world/resume.all'];
        var opts = {
          theme: 'hello-world',
          format: 'FRESH',
          prettify: true,
          silent: false
        };
        FCMD.verbs.build( src, dst, opts );
      }
      tryOpen.should.not.Throw();
    });

	  it('COMPACT theme should generate without throwing an exception', function () {
      function tryOpen() {
        var src = ['node_modules/FRESCA/exemplar/jane-doe.json'];
        var dst = ['tests/sandbox/compact/resume.all'];
        var opts = {
          theme: 'compact',
          format: 'FRESH',
          prettify: true,
          silent: false
        };
        FCMD.verbs.build( src, dst, opts );
      }
      tryOpen.should.not.Throw();
    });

    it('MODERN theme should generate without throwing an exception', function () {
      function tryOpen() {
        var src = ['node_modules/FRESCA/exemplar/jane-doe.json'];
        var dst = ['tests/sandbox/modern/resume.all'];
        var opts = {
          theme: 'modern',
          format: 'FRESH',
          prettify: true,
          silent: false
        };
        FCMD.verbs.build( src, dst, opts );
      }
      tryOpen.should.not.Throw();
    });

    it('MINIMIST theme should generate without throwing an exception', function () {
      function tryOpen() {
        var src = ['node_modules/FRESCA/exemplar/jane-doe.json'];
        var dst = ['tests/sandbox/minimist/resume.all'];
        var opts = {
          theme: 'minimist',
          format: 'FRESH',
          prettify: true,
          silent: false
        };
        FCMD.verbs.build( src, dst, opts );
      }
      tryOpen.should.not.Throw();
    });

    it('AWESOME theme should generate without throwing an exception', function () {
      function tryOpen() {
        var src = ['node_modules/FRESCA/exemplar/jane-doe.json'];
        var dst = ['tests/sandbox/awesome/resume.all'];
        var opts = {
          theme: 'awesome',
          format: 'FRESH',
          prettify: true,
          silent: false
        };
        FCMD.verbs.build( src, dst, opts );
      }
      tryOpen.should.not.Throw();
    });

});

// describe('subtract', function () {
// 	it('should return -1 when passed the params (1, 2)', function () {
// 		expect(math.subtract(1, 2)).to.equal(-1);
// 	});
// });
