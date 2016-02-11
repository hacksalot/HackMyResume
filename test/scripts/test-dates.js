/**
Test routines for HackMyResume dates, times, and datetimes.
@module test-dates.js
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



chai.config.includeStack = true;



var gig = {
  employer: 'E1'
};

var r = {
  name: 'John Doe',
  meta: {
    format: 'FRESH@0.6.0'
  },
  employment: {
    history: [ null ]
  }
};



var tests = [
  // single job, concrete start, no end
  [ { start: '2010-01-01' } , { val: 6, unit: 'year' } ],
  [ { start: '2010-01' } , { val: 6, unit: 'year' } ],
  [ { start: '2010' } , { val: 6, unit: 'year' } ],

  // single job, concrete start, concrete end
  [ { start: '2010-01-01', end: '2015-01-01' } , { val: 5, unit: 'year' } ],
  [ { start: '2010-01', end: '2015-01' } , { val: 5, unit: 'year' } ],
  [ { start: '2010', end: '2015' } , { val: 5, unit: 'year' } ],

  // single job, falsy start, falsy end
  [ { } , { val: 0, unit: 'year' } ],
  [ { start: null } , { val: 0, unit: 'year' } ],
  [ { end: null } , { val: 0, unit: 'year' } ],
  [ { start: undefined } , { val: 0, unit: 'year' } ],
  [ { end: undefined } , { val: 0, unit: 'year' } ],
  [ { start: null, end: null } , { val: 0, unit: 'year' } ],
  [ { start: '', end: '' } , { val: 0, unit: 'year' } ],
  [ { start: ' ', end: ' ' } , { val: 0, unit: 'year' } ],
  [ { start: undefined, end: undefined } , { val: 0, unit: 'year' } ],

  // two jobs (concrete start + end) -> ( concrete start )
  [ { start: '2000-01', end: '2013-01' }, { start: '2013-01' }, { val: 16, unit: 'year' } ],
  [ { start: '2000-01', end: '2013-01' }, { start: '2013-01', end: '' }, { val: 16, unit: 'year' } ],
  [ { start: '2000-01', end: '2013-01' }, { start: '2013-01', end: null }, { val: 16, unit: 'year' } ],
  [ { start: '2000-01', end: '2013-01' }, { start: '2013-01', end: 'current' }, { val: 16, unit: 'year' } ]

];



tests.forEach(function(t){
   _.initial( t ).forEach(function(t){ t.employer = 'E1' });
})



describe('Testing DATES', function () {

  tests.forEach( function(t) {

    it( JSON.stringify( _.initial(t) ), function () {
      r.employment.history = _.initial( t );
      var rObj = new FRESHResume();
      rObj.parseJSON( r );
      var dur = rObj.duration();
      expect( dur ).to.equal( _.last(t).val );
    });

  });



});
