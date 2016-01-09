
var chai = require('chai')
  , expect = chai.expect
  , should = chai.should()
  , path = require('path')
  , _ = require('underscore')
	, FRESHResume = require('../src/core/fresh-resume')
  , HMR = require( '../src/hackmyapi')
  , validator = require('is-my-json-valid')
  , READFILES = require('recursive-readdir-sync')
  , fileContains = require('../src/utils/file-contains')
  , FS = require('fs');

chai.config.includeStack = true;

function genThemes( title, src, fmt ) {

  describe('Testing themes against ' + title.toUpperCase() + ' resume ' + '(' + fmt + ')' , function () {

    var _sheet;

    function genTheme( fmt, src, themeName, themeLoc, testTitle ) {
      themeLoc = themeLoc || themeName;
      testTitle = themeName.toUpperCase() + ' theme (' + fmt + ') should generate without throwing an exception';
      it( testTitle, function () {
        function tryOpen() {
          //var src = ['node_modules/jane-q-fullstacker/resume/jane-resume.json'];
          var dst = ['test/sandbox/' + fmt + '/' + title + '/' + themeName + '/resume.all'];
          var opts = {
            theme: themeLoc,
            format: fmt,
            prettify: true,
            silent: false,
            css: 'embed'
          };
          try {
            HMR.verbs.build( src, dst, opts, function(msg) {
              msg = msg || '';
              console.log(msg);
            });
          }
          catch(ex) {
            console.log(ex);
            console.log(ex.stack);
            throw ex;
          }
        }
        tryOpen.should.not.Throw();
      });
    }

    genTheme(fmt, src, 'hello-world');
    genTheme(fmt, src, 'compact');
    genTheme(fmt, src, 'modern');
    genTheme(fmt, src, 'minimist');
    genTheme(fmt, src, 'awesome');
    genTheme(fmt, src, 'positive');
    genTheme(fmt, src, 'jsonresume-theme-boilerplate', 'node_modules/jsonresume-theme-boilerplate' );
    genTheme(fmt, src, 'jsonresume-theme-sceptile', 'node_modules/jsonresume-theme-sceptile' );
    genTheme(fmt, src, 'jsonresume-theme-modern', 'node_modules/jsonresume-theme-modern' );
    genTheme(fmt, src, 'jsonresume-theme-classy', 'node_modules/jsonresume-theme-classy' );

  });

}

function folderContains( needle, haystack ) {
  return _.some( READFILES( path.join(__dirname, haystack) ), function( absPath ) {
    if( FS.lstatSync( absPath ).isFile() ) {
      if( fileContains( absPath, needle ) ) {
        console.log('Found invalid metadata in ' + absPath);
        return true;
      }
    }
  });
}

genThemes( 'jane-q-fullstacker', ['node_modules/fresh-test-resumes/src/jane-fullstacker.fresh.json'], 'FRESH' );
genThemes( 'johnny-trouble', ['node_modules/fresh-test-resumes/src/johnny-trouble.fresh.json'], 'FRESH' );
genThemes( 'richard-hendriks', ['test/resumes/jrs-0.0.0/richard-hendriks.json'], 'JRS' );

describe('Verifying generated theme files...', function() {
  it('Generated files should not contain ICE.', function() {
    expect( folderContains('@@@@', 'sandbox') ).to.be.false;
  });
});
