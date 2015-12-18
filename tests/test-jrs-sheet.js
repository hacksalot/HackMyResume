
var chai = require('chai')
  , expect = chai.expect
  , should = chai.should()
  , path = require('path')
  , _ = require('underscore')
	, JRSResume = require('../src/core/jrs-resume')
  , validator = require('is-my-json-valid');

chai.config.includeStack = false;

describe('jane-doe.json (JRS)', function () {

    var _sheet;

	  it('should open without throwing an exception', function () {
      function tryOpen() {
        _sheet = new JRSResume().open(
          path.join( __dirname, 'resumes/jrs/jane-q-fullstacker.json' ) );
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

    it('should have a work duration of 7 years', function() {
      _sheet.basics.computed.numYears.should.equal( 7 );
    });

    it('should save without throwing an exception', function(){
      function trySave() {
        _sheet.save( 'tests/sandbox/jane-q-fullstacker.json' );
      }
      trySave.should.not.Throw();
    });

    it('should not be modified after saving', function() {
      var savedSheet = new JRSResume().open( 'tests/sandbox/jane-q-fullstacker.json' );
      _sheet.stringify().should.equal( savedSheet.stringify() )
    });

    it('should validate against the JSON Resume schema', function() {
      var result = _sheet.isValid();
      // var schemaJson = require('../src/core/resume.json');
      // var validate = validator( schemaJson, { verbose: true } );
      // var result = validate( JSON.parse( _sheet.imp.raw ) );
      result || console.log("\n\nOops, resume didn't validate. " +
       "Validation errors:\n\n", _sheet.basics.imp.validationErrors, "\n\n");
      result.should.equal( true );
    });


});
