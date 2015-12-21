
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

describe('Testing CLI interface', function () {

    var _sheet;

    function logMsg() {

    }

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

    var opts = {
      //theme: 'compact',
      format: 'FRESH',
      prettify: true,
      silent: true
    };

    var opts2 = {
      format: 'JRS',
      prettify: true,
      silent: true
    };

    run( 'new', ['tests/sandbox/new-fresh-resume.json'], [], opts, ' (FRESH format)' );
    run( 'new', ['tests/sandbox/new-jrs-resume.json'], [], opts2, ' (JRS format)' );
    run( 'new', ['tests/sandbox/new-1.json', 'tests/sandbox/new-2.json', 'tests/sandbox/new-3.json'], [], opts, ' (multiple FRESH resumes)' );
    run( 'new', ['tests/sandbox/new-jrs-1.json', 'tests/sandbox/new-jrs-2.json', 'tests/sandbox/new-jrs-3.json'], [], opts, ' (multiple JRS resumes)' );
    run( 'new', ['tests/sandbox/new-jrs-resume.json'], [], opts2, ' (JRS format)' );
    fail( 'new', [], [], opts, " (when a filename isn't specified)" );

    run( 'validate', ['node_modules/jane-q-fullstacker/resume/jane-resume.json'], [], opts, ' (FRESH format)' );
    run( 'validate', ['tests/sandbox/new-fresh-resume.json'], [], opts, ' (FRESH format)' );

    function run( verb, src, dst, opts, msg ) {
      msg = msg || '.';
      it( 'The ' + verb.toUpperCase() + ' command should SUCCEED' + msg, function () {
        function runIt() {
          FCMD.verbs[verb]( src, dst, opts, opts.silent ? logMsg : null );
        }
        runIt.should.not.Throw();
      });
    }

    function fail( verb, src, dst, opts, msg ) {
      msg = msg || '.';
      it( 'The ' + verb.toUpperCase() + ' command should FAIL' + msg, function () {
        function runIt() {
          FCMD.verbs[verb]( src, dst, opts, logMsg );
        }
        runIt.should.Throw();
      });
    }

});
