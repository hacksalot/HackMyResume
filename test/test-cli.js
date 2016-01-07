/**
@module test-cli.js
*/

var chai = require('chai')
  , expect = chai.expect
  , should = chai.should()
  , path = require('path')
  , _ = require('underscore')
	, FRESHResume = require('../src/core/fresh-resume')
  , FCMD = require( '../src/hackmyapi')
  , validator = require('is-my-json-valid')
  , EXTEND = require('../src/utils/extend');

chai.config.includeStack = false;

describe('Testing CLI interface', function () {

    var _sheet;


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

    var sb = 'test/sandbox/';
    var ft = 'node_modules/fresh-test-resumes/src/';

    [
      [ 'new', [sb + 'new-fresh-resume.json'], [], opts, ' (FRESH format)' ],
      [ 'new', [sb + 'new-jrs-resume.json'], [], opts2, ' (JRS format)'],
      [ 'new', [sb + 'new-1.json', sb + 'new-2.json', sb + 'new-3.json'], [], opts, ' (multiple FRESH resumes)' ],
      [ 'new', [sb + 'new-jrs-1.json', sb + 'new-jrs-2.json', sb + 'new-jrs-3.json'], [], opts, ' (multiple JRS resumes)' ],
      [ 'validate', [ft + 'jane-fullstacker.fresh.json'], [], opts, ' (jane-q-fullstacker|FRESH)' ],
      [ 'validate', [ft + 'johnny-trouble.fresh.json'], [], opts, ' (johnny-trouble|FRESH)' ],
      [ 'validate', [sb + 'new-fresh-resume.json'], [], opts, ' (new-fresh-resume|FRESH)' ],
      [ 'validate', ['test/resumes/jrs-0.0.0/richard-hendriks.json'], [], opts2, ' (richard-hendriks.json|JRS)' ],
      [ 'validate', ['test/resumes/jrs-0.0.0/jane-incomplete.json'], [], opts2, ' (jane-incomplete.json|JRS)' ],
      [ 'validate', [sb + 'new-1.json', sb + 'new-jrs-resume.json', sb + 'new-1.json', sb + 'new-2.json', sb + 'new-3.json'], [], opts, ' (5|BOTH)' ],
      [ 'analyze', [ft + 'jane-fullstacker.json'], [], opts, ' (jane-q-fullstacker|FRESH)' ],
      [ 'analyze', ['test/resumes/jrs-0.0.0/richard-hendriks.json'], [], opts2, ' (richard-hendriks|JRS)' ],
      [ 'build',
        [ ft + 'jane-fullstacker.fresh.json',
          ft + 'override/jane-fullstacker-override.fresh.json' ],
        [ sb + 'merged/jane-fullstacker-gamedev.fresh.all'], opts, ' (jane-q-fullstacker w/ override|FRESH)' ],
      [ 'build',
        [ ft + 'jane-fullstacker.fresh.json'],
        [ sb + 'shouldnt-exist.pdf' ],
        EXTEND(true, opts, { theme: 'awesome' }),
        ' (jane-q-fullstacker + Awesome + PDF|FRESH)' ]
    ].forEach( function(a) {
      run.apply( null, a );
    });

    fail( 'new', [], [], opts, " (when a filename isn't specified)" );


    function logMsg() {

    }



    function run( verb, src, dst, opts, msg ) {
      msg = msg || '.';
      it( 'The ' + verb.toUpperCase() + ' command should SUCCEED' + msg, function () {
        function runIt() {
          try {
            FCMD.verbs[verb]( src, dst, opts, opts.silent ?
              logMsg : function(msg){ msg = msg || ''; console.log(msg); } );
          }
          catch(ex) {
            console.error(ex);
            console.error(ex.stack);
            throw ex;
          }
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
