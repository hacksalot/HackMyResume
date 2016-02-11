/**
High-level API test routines for HackMyResume. Test HackMyResume verbs such
as build, new, peek, etc., by creating and invoking a Verb object.
@module test-verbs.js
@license MIT. See LICENSE.md for details.
*/

var chai = require('chai')
  , expect = chai.expect
  , should = chai.should()
  , path = require('path')
  , _ = require('underscore')
	, FRESHResume = require('../../dist/core/fresh-resume')
  , FCMD = require( '../../dist/index')
  , validator = require('is-my-json-valid')
  , EXTEND = require('extend');

chai.config.includeStack = false;

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

var tests = [

  [ 'new',
    [sb + 'new-fresh-resume.json'],
    [],
    opts,
    ' (FRESH format)'
  ],

  [ 'new',
    [sb + 'new-jrs-resume.json'],
    [],
    opts2,
    ' (JRS format)'
  ],

  [
    'new',
    [sb + 'new-1.json', sb + 'new-2.json', sb + 'new-3.json'],
    [],
    opts,
    ' (multiple FRESH resumes)'
  ],

  [ 'new',
    [sb + 'new-jrs-1.json', sb + 'new-jrs-2.json', sb + 'new-jrs-3.json'],
    [],
    opts,
    ' (multiple JRS resumes)'
  ],

  [ 'new',
    [],
    [],
    opts,
    " (when a filename isn't specified)"
  ],

  [ 'validate',
    [ft + 'jane-fullstacker.json'],
    [],
    opts,
    ' (jane-q-fullstacker|FRESH)'
  ],

  [ 'validate',
    [ft + 'johnny-trouble.json'],
    [],
    opts,
    ' (johnny-trouble|FRESH)'
  ],

  [ 'validate',
    [sb + 'new-fresh-resume.json'],
    [],
    opts,
    ' (new-fresh-resume|FRESH)'
  ],

  [ 'validate',
    ['test/resumes/jrs-0.0.0/richard-hendriks.json'],
    [],
    opts2,
    ' (richard-hendriks.json|JRS)'
  ],

  [ 'validate',
    ['test/resumes/jrs-0.0.0/jane-incomplete.json'],
    [],
    opts2,
    ' (jane-incomplete.json|JRS)'
  ],

  [ 'validate',
    [sb + 'new-1.json', sb + 'new-jrs-resume.json', sb + 'new-1.json',
      sb + 'new-2.json', sb + 'new-3.json'],
    [],
    opts,
    ' (5|BOTH)'
  ],

  [ 'analyze',
    [ft + 'jane-fullstacker.json'],
    [],
    opts,
    ' (jane-q-fullstacker|FRESH)'
  ],

  [ 'analyze',
    ['test/resumes/jrs-0.0.0/richard-hendriks.json'],
    [],
    opts2,
    ' (richard-hendriks|JRS)'
  ],

  [ 'build',
    [ ft + 'jane-fullstacker.json', ft + 'override/jane-fullstacker-override.fresh.json' ],
    [ sb + 'merged/jane-fullstacker-gamedev.fresh.all'],
    opts,
    ' (jane-q-fullstacker w/ override|FRESH)'
  ],

  [ 'build',
    [ ft + 'override/jane-partial-a.json', ft + 'override/jane-partial-b.json',
      ft + 'override/jane-partial-c.json' ],
    [ sb + 'merged/jane-abc.fresh.all'],
    opts,
    ' (jane merge A + B + C|FRESH)',
    function( r ) {
      var expected = [
        'name','meta','info', 'contact', 'location', 'projects', 'social',
        'employment', 'education', 'affiliation', 'service', 'skills',
        'samples', 'writing', 'reading', 'speaking', 'recognition',
        'references', 'testimonials', 'languages', 'interests',
        'extracurricular', 'governance'
      ];
      return Object.keys( _.pick( r, expected ) ).length === expected.length;
    }
  ],

  [ 'build',
    [ ft + 'jane-fullstacker.json'],
    [ sb + 'shouldnt-exist.pdf' ],
    EXTEND(true, {}, opts, { theme: 'awesome' }),
    ' (jane-q-fullstacker + Awesome + PDF|FRESH)'
  ]

];

describe('Testing API interface', function () {

    function run( verb, src, dst, opts, msg, fnTest ) {

      msg = msg || '.';
      var shouldSucceed = true;
      if( verb[0] === '!' ) {
        verb = verb.substr(1);
        shouldSucceed = false;
      }

      it( 'The ' + verb.toUpperCase() + ' command should ' +
          (shouldSucceed ? ' NOT THROW' : ' THROW') + msg, function () {

        function runIt() {
          try {
            var v = new FCMD.verbs[verb]();
            v.on('hmr:error', function(ex) { throw ex; });
            var prom = v.invoke( src, dst, opts );
            prom.then(
              function( obj ) {
                if( fnTest )
                  if( !fnTest( obj ) )
                    throw "Test: Unexpected API result.";
              },
              function( error ) {
                throw error;
              }
            );

          }
          catch(ex) {
            console.error(ex);
            if( ex.stack || (ex.inner && ex.inner.stack))
              console.error( ex.stack || ex.inner.stack );
            throw ex;
          }
        }

        if( shouldSucceed )
          runIt.should.not.Throw();
        else
          runIt.should.Throw();
      });

    }

    tests.forEach( function(a) {
      run.apply( /* The players of */ null, a );
    });

});
