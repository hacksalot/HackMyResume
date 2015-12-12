
var chai = require('chai')
  , expect = chai.expect
  , should = chai.should()
  , path = require('path')
  , _ = require('underscore')
	, FRESHResume = require('../src/core/fresh-resume')
  , validator = require('is-my-json-valid');

chai.config.includeStack = false;

describe('jane-doe.json (FRESH)', function () {

    var _sheet;

	  it('should open without throwing an exception', function () {
      function tryOpen() {
        _sheet = new FRESHResume().open(
          'node_modules/FRESCA/exemplar/jane-doe.json' );
      }
      tryOpen.should.not.Throw();
    });

    it('should have one or more of each section', function() {
      expect(
        //(_sheet.basics) &&
        _sheet.name && _sheet.info && _sheet.location && _sheet.contact &&
        (_sheet.employment.history && _sheet.employment.history.length > 0) &&
        (_sheet.skills && _sheet.skills.list.length > 0) &&
        (_sheet.education.history && _sheet.education.history.length > 0) &&
        (_sheet.service.history && _sheet.service.history.length > 0) &&
        (_sheet.writing && _sheet.writing.length > 0) &&
        (_sheet.recognition && _sheet.recognition.length > 0) &&
        (_sheet.samples && _sheet.samples.length > 0) &&
        (_sheet.references && _sheet.references.length > 0) &&
        (_sheet.interests && _sheet.interests.length > 0)
      ).to.equal( true );
    });

    it('should have a work duration of 7 years', function() {
      _sheet.computed.numYears.should.equal( 7 );
    });

    it('should save without throwing an exception', function(){
      function trySave() {
        _sheet.save( 'tests/sandbox/jane-doe.json' );
      }
      trySave.should.not.Throw();
    });

    it('should not be modified after saving', function() {
      var savedSheet = new FRESHResume().open('tests/sandbox/jane-doe.json');
      _sheet.stringify().should.equal( savedSheet.stringify() )
    });

    it('should validate against the FRESH resume schema', function() {
      var result = _sheet.isValid();
      // var schemaJson = require('FRESCA');
      // var validate = validator( schemaJson, { verbose: true } );
      // var result = validate( JSON.parse( _sheet.imp.raw ) );
      result || console.log("\n\nOops, resume didn't validate. " +
        "Validation errors:\n\n", _sheet.imp.validationErrors, "\n\n");
      result.should.equal( true );
    });


});
