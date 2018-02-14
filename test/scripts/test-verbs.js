/**
High-level API test routines for HackMyResume. Test HackMyResume verbs such
as build, new, peek, etc., by creating and invoking a Verb object.
@module test-verbs.js
@license MIT. See LICENSE.md for details.
*/

var chai = require('chai')
  , chaiAsPromised = require("chai-as-promised")
  , path = require('path')
  , _ = require('underscore')
	, FRESHResume = require('../../src/core/fresh-resume')
  , FCMD = require( '../../src/index')
  , validator = require('is-my-json-valid')
  , EXTEND = require('extend');

// Initialize Chai As Promised
chai.use(chaiAsPromised);
expect = chai.expect;
assert = chai.assert;
should = chai.should();
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

// Assemble an array of tests, taking the form of parameters we'll pass to
// each of the defined HackMyResume verbs.
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

  [ '!new',
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
    ['node_modules/fresh-test-resumes/src/jrs/richard-hendriks.json'],
    [],
    opts2,
    ' (richard-hendriks.json|JRS)'
  ],

  [ 'validate',
    ['node_modules/fresh-test-resumes/src/jrs/jane-incomplete.json'],
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
    ['node_modules/fresh-test-resumes/src/jrs/richard-hendriks.json'],
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

      Object.keys( _.pick( r, expected ) ).length
        .should.equal( expected.length );
    }
  ],

  [ '!build',
    [ ft + 'jane-fullstacker.json'],
    [ sb + 'shouldnt-exist.pdf' ],
    EXTEND(true, {}, opts, { theme: 'awesome' }),
    ' (jane-q-fullstacker + Awesome + PDF|FRESH)'
  ]

];

// Set up the main test suite for the API interface
describe('Testing API interface', function () {

  this.timeout(5000);

  function run( verb, src, dst, opts, msg, fnTest ) {

    msg = msg || '.';
    var shouldSucceed = true;
    if( verb[0] === '!' ) {
      verb = verb.substr(1);
      shouldSucceed = false;
    }

    it( 'The ' + verb.toUpperCase() + ' command should ' +
        (shouldSucceed ? ' SUCCEED' : ' FAIL') + msg, function (done) {

      var v = new FCMD.verbs[verb]();
      v.on('hmr:error', function(ex) {
        assert(false);
      });
      var prom = v.invoke( src, dst, opts );
      var fulfillMethod = shouldSucceed ? 'fulfilled' : 'rejected';

      if( fnTest ) {
        prom.should.be[ fulfillMethod ].then( function( obj ) {
          fnTest(obj.sheet);
        }).should.notify(done);
      }
      else {
        prom.should.be[fulfillMethod].notify(done);
      }

    });

  }

  tests.forEach( function(a) {
    run.apply( /* The players of */ null, a );
  });

});
