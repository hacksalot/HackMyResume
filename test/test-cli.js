
var chai = require('chai')
  , expect = chai.expect
  , should = chai.should()
  , path = require('path')
  , _ = require('underscore')
	, FRESHResume = require('../src/core/fresh-resume')
  , FCMD = require( '../src/hackmyapi')
  , validator = require('is-my-json-valid');

chai.config.includeStack = false;

describe('Testing CLI interface', function () {

    var _sheet;

    function logMsg() {

    }

    var opts = {
      format: 'FRESH',
      prettify: true,
      silent: false,
      assert: true  // Causes validation errors to throw exceptions
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

    run( 'validate', ['node_modules/fresh-test-resumes/src/jane-fullstacker.fresh.json'], [], opts, ' (jane-q-fullstacker|FRESH)' );
    run( 'validate', ['node_modules/fresh-test-resumes/src/johnny-trouble.fresh.json'], [], opts, ' (johnny-trouble|FRESH)' );
    fail( 'validate', ['test/sandbox/new-fresh-resume.json'], [], opts, ' (new-fresh-resume|FRESH)' );
    run( 'validate', ['test/resumes/jrs-0.0.0/richard-hendriks.json'], [], opts2, ' (richard-hendriks.json|JRS)' );
    run( 'validate', ['test/resumes/jrs-0.0.0/jane-incomplete.json'], [], opts2, ' (jane-incomplete.json|JRS)' );
    fail( 'validate', ['test/sandbox/new-1.json','test/sandbox/new-jrs-resume.json','test/sandbox/new-1.json', 'test/sandbox/new-2.json', 'test/sandbox/new-3.json'], [], opts, ' (5|BOTH)' );

    run( 'analyze', ['node_modules/fresh-test-resumes/src/jane-fullstacker.json'], [], opts, ' (jane-q-fullstacker|FRESH)' );
    run( 'analyze', ['test/resumes/jrs-0.0.0/richard-hendriks.json'], [], opts2, ' (richard-hendriks|JRS)' );

    run( 'build',
      [ 'node_modules/fresh-test-resumes/src/jane-fullstacker.fresh.json',
        'node_modules/fresh-test-resumes/src/override/jane-fullstacker-override.fresh.json' ],
      [ 'test/sandbox/merged/jane-fullstacker-gamedev.fresh.all'], opts, ' (jane-q-fullstacker w/ override|FRESH)'
    );

    function run( verb, src, dst, opts, msg ) {
      msg = msg || '.';
      it( 'The ' + verb.toUpperCase() + ' command should SUCCEED' + msg, function () {
        function runIt() {
          FCMD.verbs[verb]( src, dst, opts, opts.silent ? logMsg : function(msg){ msg = msg || ''; console.log(msg); } );
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
