/**
@module error-handler.js
*/

(function() {

  var HACKMYSTATUS = require('./status-codes')
    , PKG = require('../../package.json')
    , FS = require('fs')
    , FCMD = require('../hackmycmd')
    , PATH = require('path')
    , title = ('\n*** HackMyResume v' + PKG.version + ' ***').bold.white;

  var ErrorHandler = module.exports = {


    err: function( ex, shouldExit ) {
      var msg = '', exitCode;

      if( ex.fluenterror ){
        switch( ex.fluenterror ) { // TODO: Remove magic numbers

          case HACKMYSTATUS.themeNotFound:
            msg = "The specified theme couldn't be found: " + ex.data;
            break;

          case HACKMYSTATUS.copyCSS:
            msg = "Couldn't copy CSS file to destination folder";
            break;

          case HACKMYSTATUS.resumeNotFound:
            msg = 'Please '.guide + 'feed me a resume'.guide.bold +
              ' in FRESH or JSON Resume format.'.guide;
            break;

          case HACKMYSTATUS.missingCommand:
            msg = title + "\nPlease ".guide + "give me a command".guide.bold +
              " (".guide;

            msg += Object.keys( FCMD.verbs ).map( function(v, idx, ar) {
              return (idx === ar.length - 1 ? 'or '.guide : '') +
                v.toUpperCase().guide;
            }).join(', '.guide) + ").\n\n".guide;

            msg += FS.readFileSync(
              PATH.resolve(__dirname, '../use.txt'), 'utf8' ).info.bold;
            break;

          case HACKMYSTATUS.invalidCommand:
            msg = 'Please '.guide + 'specify the output resume file'.guide.bold +
              ' that should be created.'.guide;
            break;

          case HACKMYSTATUS.resumeNotFoundAlt:
            msg = 'Please '.guide + 'feed me a resume'.guide.bold +
              ' in either FRESH or JSON Resume format.'.guide;
            break;

          case HACKMYSTATUS.inputOutputParity:
            msg = 'Please '.guide + 'specify an output file name'.guide.bold +
              ' for every input file you wish to convert.'.guide;
            break;

          case HACKMYSTATUS.createNameMissing:
            msg = 'Please '.guide + 'specify the filename of the resume'.guide.bold +
              ' to create.'.guide;
            break;

          case HACKMYSTATUS.wkhtmltopdf:
            msg = 'ERROR: PDF generation failed. '.red.bold + ('Make sure wkhtmltopdf is ' +
            'installed and accessible from your path.').red;
            break;

        }
        exitCode = ex.fluenterror;

      }
      else {
        msg = ex.toString();
        exitCode = 4;
      }

      var idx = msg.indexOf('Error: ');
      var trimmed = idx === -1 ? msg : msg.substring( idx + 7 );
      if( !ex.fluenterror || ex.fluenterror < 3 ) { // TODO: magic #s
        console.log( ('ERROR: ' + trimmed.toString()).red.bold );
        console.log( ex.stack.gray);
      }
      else {
        console.log( trimmed.toString() );
      }

      if( shouldExit )
        process.exit( exitCode );

    }

  };

}());
