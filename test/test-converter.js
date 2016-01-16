
var chai = require('chai')
  , expect = chai.expect
  , should = chai.should()
  , path = require('path')
  , parsePath = require('parse-filepath')
  , _ = require('underscore')
	, FRESHResume = require('../src/core/fresh-resume')
  , JRSResume = require('../src/core/jrs-resume')
  , CONVERTER = require('fresh-jrs-converter')
  , FS = require('fs')
  , MKDIRP = require('mkdirp')
  , _ = require('underscore');

chai.config.includeStack = false;

describe('FRESH/JRS converter', function () {

    var _sheet;

	  it('should round-trip from JRS to FRESH to JRS without modifying or losing data', function () {

      var fileA = path.join( __dirname, 'resumes/jrs-0.0.0/richard-hendriks.json' );
      var fileB = path.join( __dirname, 'sandbox/richard-hendriks.converted.fresh.json' );
      var fileC = path.join( __dirname, 'sandbox/richard-hendriks.converted.jrs.json' );

      _sheet = new JRSResume().open( fileA );
      MKDIRP.sync( parsePath( fileB ).dirname );
      _sheet.saveAs( fileB, 'FRESH' );

      var freshSheet = new FRESHResume().open( fileB );
      freshSheet.saveAs( fileC, 'JRS' );

      var rawA = FS.readFileSync( fileA, 'utf8' );
      var rawC = FS.readFileSync( fileC, 'utf8' );

      var objA = JSON.parse( rawA );
      var objC = JSON.parse( rawC );

      _.isEqual(objA, objC).should.equal(true);

    });

});
