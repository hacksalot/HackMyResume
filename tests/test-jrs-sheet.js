
var chai = require('chai')
  , expect = chai.expect
  , should = chai.should()
  , path = require('path')
  , _ = require('underscore')
	, JRSResume = require('../src/core/jrs-resume')
  , validator = require('is-my-json-valid');

chai.config.includeStack = false;

describe('fullstack.json (JRS)', function () {

    var _sheet;

	  it('should open without throwing an exception', function () {
      function tryOpen() {
        _sheet = new JRSResume().open( 'node_modules/resample/fullstack/in/resume.json' );
      }
      tryOpen.should.not.Throw();
    });

    it('should have one or more of each section', function() {
      expect(
        (_sheet.basics) &&
        (_sheet.work && _sheet.work.length > 0) &&
        (_sheet.skills && _sheet.skills.length > 0) &&
        (_sheet.education && _sheet.education.length > 0) &&
        (_sheet.volunteer && _sheet.volunteer.length > 0) &&
        (_sheet.publications && _sheet.publications.length > 0) &&
        (_sheet.awards && _sheet.awards.length > 0)
      ).to.equal( true );
    });

    it('should have a work duration of 11 years', function() {
      _sheet.computed.numYears.should.equal( 11 );
    });

    it('should save without throwing an exception', function(){
      function trySave() {
        _sheet.save( 'tests/sandbox/fullstack.json' );
      }
      trySave.should.not.Throw();
    });

    it('should not be modified after saving', function() {
      var savedSheet = new JRSResume().open( 'tests/sandbox/fullstack.json' );
      _sheet.stringify().should.equal( savedSheet.stringify() )
    });

    it('should validate against the JSON Resume schema', function() {
      var schemaJson = require('../src/core/resume.json');
      var validate = validator( schemaJson, { verbose: true } );
      var result = validate( JSON.parse( _sheet.imp.raw ) );
      result || console.log("\n\nOops, resume didn't validate. " +
       "Validation errors:\n\n", validate.errors, "\n\n");
      result.should.equal( true );
    });


});

// describe('subtract', function () {
// 	it('should return -1 when passed the params (1, 2)', function () {
// 		expect(math.subtract(1, 2)).to.equal(-1);
// 	});
// });
