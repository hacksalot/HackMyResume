/**
@module test-api.js
*/

var chai = require('chai')
  , expect = chai.expect
  , should = chai.should()
  , path = require('path')
  , _ = require('underscore')
	, FRESHResume = require('../src/core/fresh-resume')
  , FCMD = require( '../src/hackmyapi')
  , validator = require('is-my-json-valid')
  , HMRMAIN = require('../src/cli/main')
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
    var ft = 'node_modules/fresh-test-resumes/src/fresh/';

    [

      [ 'new',      [sb + 'new-fresh-resume.json'], [], opts, ' (FRESH format)' ],
      [ 'new',      [sb + 'new-jrs-resume.json'], [], opts2, ' (JRS format)'],
      [ 'new',      [sb + 'new-1.json', sb + 'new-2.json', sb + 'new-3.json'], [], opts, ' (multiple FRESH resumes)' ],
      [ 'new',      [sb + 'new-jrs-1.json', sb + 'new-jrs-2.json', sb + 'new-jrs-3.json'], [], opts, ' (multiple JRS resumes)' ],
      [ '!new',     [], [], opts, " (when a filename isn't specified)" ],

      [ 'validate', [ft + 'jane-fullstacker.json'], [], opts, ' (jane-q-fullstacker|FRESH)' ],
      [ 'validate', [ft + 'johnny-trouble.json'], [], opts, ' (johnny-trouble|FRESH)' ],
      [ 'validate', [sb + 'new-fresh-resume.json'], [], opts, ' (new-fresh-resume|FRESH)' ],
      [ 'validate', ['test/resumes/jrs-0.0.0/richard-hendriks.json'], [], opts2, ' (richard-hendriks.json|JRS)' ],
      [ 'validate', ['test/resumes/jrs-0.0.0/jane-incomplete.json'], [], opts2, ' (jane-incomplete.json|JRS)' ],
      [ 'validate', [sb + 'new-1.json', sb + 'new-jrs-resume.json', sb + 'new-1.json', sb + 'new-2.json', sb + 'new-3.json'], [], opts, ' (5|BOTH)' ],

      [ 'analyze',  [ft + 'jane-fullstacker.json'], [], opts, ' (jane-q-fullstacker|FRESH)' ],
      [ 'analyze',  ['test/resumes/jrs-0.0.0/richard-hendriks.json'], [], opts2, ' (richard-hendriks|JRS)' ],

      [ 'build',    [ ft + 'jane-fullstacker.json', ft + 'override/jane-fullstacker-override.fresh.json' ], [ sb + 'merged/jane-fullstacker-gamedev.fresh.all'], opts, ' (jane-q-fullstacker w/ override|FRESH)' ],
      [ '!build',   [ ft + 'jane-fullstacker.json'], [ sb + 'shouldnt-exist.pdf' ], EXTEND(true, opts, { theme: 'awesome' }), ' (jane-q-fullstacker + Awesome + PDF|FRESH)' ]

    ].forEach( function(a) {

      run.apply( /* The players of */ null, a );

    });


    function run( verb, src, dst, opts, msg ) {
      msg = msg || '.';
      var shouldSucceed = true;
      if( verb[0] === '!' ) {
        verb = verb.substr(1);
        shouldSucceed = false;
      }
      it( 'The ' + verb.toUpperCase() + ' command should ' + (shouldSucceed ? ' SUCCEED' : ' FAIL') + msg, function () {
        function runIt() {
          try {
            var v = new FCMD.verbs[verb]();
            v.on('hmr:error', function(ex) {
              throw ex;
            });
            v.invoke( src, dst, opts, opts.silent ?
              function(){} : function(msg){ msg = msg || ''; console.log(msg); } );
          }
          catch(ex) {
            console.error(ex);
            console.error(ex.stack);
            throw ex;
          }
        }
        if( shouldSucceed )
          runIt.should.not.Throw();
        else
          runIt.should.Throw();
      });
    }



});
