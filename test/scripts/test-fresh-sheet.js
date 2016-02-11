/**
Test routines for the FRESHResume class.
@module test-jrs-sheet.js
@license MIT. See LICENSE.md for details.
*/



var chai = require('chai')
  , expect = chai.expect
  , should = chai.should()
  , path = require('path')
  , _ = require('underscore')
	, FRESHResume = require('../../dist/core/fresh-resume')
  , ResumeFactory = require('../../dist/core/resume-factory')
  , validator = require('is-my-json-valid');



chai.config.includeStack = false;



function testResume(opts) {

  describe( opts.title + ' (FRESH)', function () {

      var _sheet;

  	  it('should open without throwing an exception', function () {
        function tryOpen() {
          var res = ResumeFactory.loadOne( opts.path, { objectify: true } );
          _sheet = res.rez;
          //_sheet = new FRESHResume().open( opts.path );
        }
        tryOpen.should.not.Throw();
      });

      it('should have one or more of each section', function() {
        var newObj = _.pick( _sheet, opts.sections );
        expect( Object.keys(newObj).length ).to.equal( opts.sections.length );
      });

      it('should have a work duration of ' + opts.duration + ' years', function() {
        _sheet.computed.numYears.should.equal( opts.duration );
      });

      it('should save without throwing an exception', function(){
        function trySave() {
          _sheet.save( 'test/sandbox/' + opts.title + '.json' );
        }
        trySave.should.not.Throw();
      });

      it('should not be modified after saving', function() {
        var savedSheet = ResumeFactory.loadOne( 'test/sandbox/' + opts.title + '.json', { objectify: true } );
        //var savedSheet = new FRESHResume().open('test/sandbox/' + opts.title + '.json');
        _sheet.stringify().should.equal( savedSheet.rez.stringify() );
      });

      it('should validate against the FRESH resume schema', function() {
        var result = _sheet.isValid();
        // var schemaJson = require('fresca');
        // var validate = validator( schemaJson, { verbose: true } );
        // var result = validate( JSON.parse( _sheet.imp.raw ) );
        result || console.log("\n\nOops, resume didn't validate. " +
          "Validation errors:\n\n", _sheet.imp.validationErrors, "\n\n");
        result.should.equal( true );
      });


  });
}

var sects = [ 'info', 'employment', 'service', 'skills', 'education', 'writing', 'recognition', 'references' ];
testResume({ title: 'jane-q-fullstacker', path: 'node_modules/fresh-test-resumes/src/fresh/jane-fullstacker.json', duration: 7, sections: sects });
testResume({ title: 'johnny-trouble-resume', path: 'node_modules/fresh-test-resumes/src/fresh/johnny-trouble.json', duration: 4, sections: sects });

sects = [ 'info', 'contact', 'location' ];
testResume({ title: 'jane-q-fullstacker A', path: 'node_modules/fresh-test-resumes/src/fresh/override/jane-partial-a.json', duration: 0, sections: sects });

sects = [ 'projects', 'social', 'employment', 'education', 'affiliation' ];
testResume({ title: 'jane-q-fullstacker B', path: 'node_modules/fresh-test-resumes/src/fresh/override/jane-partial-b.json', duration: 7, sections: sects });

sects = [ 'service', 'skills', 'samples', 'writing', 'reading', 'speaking', 'recognition', 'references', 'testimonials', 'languages', 'interests', 'extracurricular', 'governance' ];
testResume({ title: 'jane-q-fullstacker C', path: 'node_modules/fresh-test-resumes/src/fresh/override/jane-partial-c.json', duration: 0, sections: sects });
