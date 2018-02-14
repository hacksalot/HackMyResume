/**
Theme test routines for HackMyResume. Test all preinstalled HackMyResume themes
along with a handful of JSON Resume themes for good measure. Uses the HMR verb
interface.
@module test-themes.js
@license MIT. See LICENSE.md for details.
*/


var chai         = require('chai')
  , expect       = chai.expect
  , should       = chai.should()
  , path         = require('path')
  , _            = require('underscore')
  , HackMyResume = require( '../../src/index')
  , readFolder   = require('recursive-readdir-sync')
  , fileContains = require('../../src/utils/file-contains')
  , dirCompare   = require('dir-compare');

// Include stack traces for failed tests.
chai.config.includeStack = true;

/**
Test the specified resume against multiple themes.
*/
function genThemes( title, src, fmt ) {

  // Set up a new suite
  describe('Testing themes against ' + title.toUpperCase()
    + ' resume ' + '(' + fmt + ')' , function () {

    // Increase the timeout since resume generation can be expensive..
    this.timeout(50000);

    // Define a local function to build a single resume to MULTIPLE themes
    function genTheme( fmt, src, themeName, themeLoc, testTitle ) {
      themeLoc = themeLoc || themeName;
      testTitle = themeName.toUpperCase() + ' theme (' + fmt +
        ') should generate without throwing an exception';

      // Instantiate a test case
      it( testTitle, function () {

        // Set up options
        var dst = ['test/sandbox/' + fmt + '/' + title + '/' +
          themeName + '/resume.all'];
        var opts = {
          theme: themeLoc,
          format: fmt,
          prettify: true,
          silent: false,
          css: 'embed',
          debug: true
        };

        // Run the command!
        var v = new HackMyResume.verbs.build();
        v.on('hmr:error', function(ex) {
          console.error('Error thrown: %o', ex);
          throw ex;
          //assert(false);
        });
        var p = v.invoke( src, dst, opts );

        // Let Mocha sort out the promise result
        return p.then(
          function(obj) { }
          //,function(obj) { },
        );

      });
    }

    // Build the resume for each theme
    //genTheme(fmt, src, 'hello-world');
    genTheme(fmt, src, 'compact');
    genTheme(fmt, src, 'modern');
    genTheme(fmt, src, 'underscore', 'node_modules/fresh-theme-underscore' );
    genTheme(fmt, src, 'awesome');
    genTheme(fmt, src, 'positive');

    genTheme(fmt, src, 'jsonresume-theme-boilerplate',
       'node_modules/jsonresume-theme-boilerplate' );
    genTheme(fmt, src, 'jsonresume-theme-sceptile',
      'node_modules/jsonresume-theme-sceptile' );
    genTheme(fmt, src, 'jsonresume-theme-modern',
      'node_modules/jsonresume-theme-modern' );
    genTheme(fmt, src, 'jsonresume-theme-classy',
      'node_modules/jsonresume-theme-classy' );

  });

}

function folderContains( needle, haystack ) {
  var ignoreExts = ['.png','.jpg','.jpeg','.bmp','.pdf', '.gif'];
  var safePath = path.normalize( path.join(__dirname, haystack));
  return _.some( readFolder( safePath ), function( absPath ) {
    if( require('fs').lstatSync( absPath ).isFile() ) {
      var pathInfo = path.parse( absPath );
      if( !_.contains(ignoreExts, pathInfo.ext) &&
          fileContains(absPath, needle) ) {
        console.error('Found invalid metadata in ' + absPath);
        return true;
      }
      return false;
    }
  });
}

function foldersMatch( a, b ) {
  var ret;
  ret = dirCompare.compareSync(a, b, {compareSize: true, skipSubdirs: true});
  if( !ret.same ) return false;
  ret = dirCompare.compareSync(a, b, {compareContent: true, skipSubdirs: true});
  return ret.differences === 1;
}

genThemes(
  'jane-q-fullstacker',
  ['node_modules/fresh-test-resumes/src/fresh/jane-fullstacker.json'],
  'FRESH'
);

genThemes(
  'johnny-trouble',
  ['node_modules/fresh-test-resumes/src/fresh/johnny-trouble.json'],
  'FRESH'
);

genThemes(
  'richard-hendriks',
  ['node_modules/fresh-test-resumes/src/jrs/richard-hendriks.json'],
  'JRS'
);

describe('Verifying generated theme files...', function() {

  it('Generated files should not contain ICE.', function() {
    var q = folderContains('@@@@', '../sandbox');
    q.should.equal(false);
  });

  // it('Generated files should match exemplars...', function() {
  //   var q = foldersMatch( 'test/sandbox/FRESH/jane-q-fullstacker/modern',
  //       'test/expected/modern' );
  //   q.should.equal(true);
  // });

});
