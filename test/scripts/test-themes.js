/**
Theme test routines for HackMyResume. Test all preinstalled HackMyResume themes
along with a handful of JSON Resume themes for good measure. Uses the HMR verb
interface.
@module test-themes.js
@license MIT. See LICENSE.md for details.
*/


var chai = require('chai')
  , expect = chai.expect
  , should = chai.should()
  , path = require('path')
  , _ = require('underscore')
	, FRESHResume = require('../../dist/core/fresh-resume')
  , HMR = require( '../../dist/index')
  , validator = require('is-my-json-valid')
  , READFILES = require('recursive-readdir-sync')
  , fileContains = require('../../dist/utils/file-contains')
  , FS = require('fs')
  , CHALK = require('chalk')
  , DIRCOMP = require('dir-compare');

chai.config.includeStack = true;

function genThemes( title, src, fmt ) {

  describe('Testing themes against ' + title.toUpperCase() + ' resume ' + '(' + fmt + ')' , function () {

    this.timeout(30000);
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
            css: 'embed',
            debug: true
          };
          try {
            var v = new HMR.verbs.build();
            var p = v.invoke( src, dst, opts );
            p.then(
              function(obj){

              },
              function(obj){
                throw obj;
              }
            );
          }
          catch(ex) {
            console.error( ex );
            console.error( ex.stack );
            throw ex;
          }
        }
        tryOpen.should.not.Throw();
      });
    }

    genTheme(fmt, src, 'hello-world');
    genTheme(fmt, src, 'compact');
    genTheme(fmt, src, 'modern');
    genTheme(fmt, src, 'underscore');
    genTheme(fmt, src, 'awesome');
    genTheme(fmt, src, 'positive');
    genTheme(fmt, src, 'jsonresume-theme-boilerplate', 'node_modules/jsonresume-theme-boilerplate' );
    genTheme(fmt, src, 'jsonresume-theme-sceptile', 'node_modules/jsonresume-theme-sceptile' );
    genTheme(fmt, src, 'jsonresume-theme-modern', 'node_modules/jsonresume-theme-modern' );
    genTheme(fmt, src, 'jsonresume-theme-classy', 'node_modules/jsonresume-theme-classy' );

  });

}

function folderContains( needle, haystack ) {
  return _.some( READFILES( path.normalize( path.join(__dirname, haystack))), function( absPath ) {
    if( FS.lstatSync( absPath ).isFile() ) {
      if( fileContains( absPath, needle ) ) {
        console.error('Found invalid metadata in ' + absPath);
        return true;
      }
    }
  });
}

function foldersMatch( a, b ) {
  var ret;
  ret = DIRCOMP.compareSync(a, b, {compareSize: true, skipSubdirs: true});
  if( !ret.same ) return false;
  ret = DIRCOMP.compareSync(a, b, {compareContent: true, skipSubdirs: true});
  return ret.differences === 1;
}

genThemes( 'jane-q-fullstacker', ['node_modules/fresh-test-resumes/src/fresh/jane-fullstacker.json'], 'FRESH' );
genThemes( 'johnny-trouble', ['node_modules/fresh-test-resumes/src/fresh/johnny-trouble.json'], 'FRESH' );
genThemes( 'richard-hendriks', ['test/resumes/jrs-0.0.0/richard-hendriks.json'], 'JRS' );

describe('Verifying generated theme files...', function() {

  it('Generated files should not contain ICE.', function() {
    expect( folderContains('@@@@', '../sandbox') ).to.be.false;
  });

  it('Generated files should match exemplars...', function() {
    expect( foldersMatch( 'test/sandbox/FRESH/jane-q-fullstacker/modern', 'test/expected/modern' ) ).to.be.true;
  });

});
