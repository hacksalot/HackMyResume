
var chai = require('chai')
  , expect = chai.expect
  , should = chai.should()
  , path = require('path')
  , _ = require('underscore')
	, FRESHResume = require('../src/core/fresh-resume')
  , FCMD = require( '../src/hackmycmd')
  , validator = require('is-my-json-valid');

chai.config.includeStack = false;

describe('Testing CLI interface', function () {

    var _sheet;

    function logMsg() {

    }

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

    run( 'new', ['test/sandbox/new-fresh-resume.json'], [], opts, ' (FRESH format)' );
    run( 'new', ['test/sandbox/new-jrs-resume.json'], [], opts2, ' (JRS format)' );
    run( 'new', ['test/sandbox/new-1.json', 'test/sandbox/new-2.json', 'test/sandbox/new-3.json'], [], opts, ' (multiple FRESH resumes)' );
    run( 'new', ['test/sandbox/new-jrs-1.json', 'test/sandbox/new-jrs-2.json', 'test/sandbox/new-jrs-3.json'], [], opts, ' (multiple JRS resumes)' );
    fail( 'new', [], [], opts, " (when a filename isn't specified)" );

    run( 'validate', ['node_modules/jane-q-fullstacker/resume/jane-resume.json'], [], opts, ' (jane-q-fullstacker|FRESH)' );
    run( 'validate', ['node_modules/johnny-trouble-resume/src/johnny-trouble.fresh.json'], [], opts, ' (johnny-trouble|FRESH)' );
    run( 'validate', ['test/sandbox/new-fresh-resume.json'], [], opts, ' (new-fresh-resume|FRESH)' );
    run( 'validate', ['test/resumes/jrs-0.0.0/richard-hendriks.json'], [], opts2, ' (richard-hendriks.json|JRS)' );
    run( 'validate', ['test/resumes/jrs-0.0.0/jane-incomplete.json'], [], opts2, ' (jane-incomplete.json|JRS)' );
    run( 'validate', ['test/sandbox/new-1.json','test/sandbox/new-jrs-resume.json','test/sandbox/new-1.json', 'test/sandbox/new-2.json', 'test/sandbox/new-3.json'], [], opts, ' (5|BOTH)' );

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
