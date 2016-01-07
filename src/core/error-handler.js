/**
Error-handling routines for HackMyResume.
@module error-handler.js
@license MIT. See LICENSE.md for details.
*/



(function() {



  var HACKMYSTATUS = require('./status-codes')
    , PKG = require('../../package.json')
    , FS = require('fs')
    , FCMD = require('../hackmyapi')
    , PATH = require('path')
    , chalk = require('chalk');



  /**
  An amorphous blob of error handling code for HackMyResume.
  @class ErrorHandler
  */
  var ErrorHandler = module.exports = {



    err: function( ex, shouldExit ) {
      var msg = '', exitCode;

      if( ex.handled ) {
        if( shouldExit )
          process.exit( exitCode );
        return;
      }


      if( ex.fluenterror ){

        switch( ex.fluenterror ) {

          case HACKMYSTATUS.themeNotFound:
            msg = "The specified theme couldn't be found: " + ex.data;
            break;

          case HACKMYSTATUS.copyCSS:
            msg = "Couldn't copy CSS file to destination folder";
            break;

          case HACKMYSTATUS.resumeNotFound:
            msg = chalk.yellow('Please ') + chalk.yellow.bold('feed me a resume') +
              chalk.yellow(' in FRESH or JSON Resume format.');
            break;

          case HACKMYSTATUS.missingCommand:
            msg = chalk.yellow("Please ") + chalk.yellow.bold("give me a command") +
              chalk.yellow(" (");

            msg += Object.keys( FCMD.verbs ).map( function(v, idx, ar) {
              return (idx === ar.length - 1 ? chalk.yellow('or ') : '') +
                chalk.yellow.bold(v.toUpperCase());
            }).join( chalk.yellow(', ')) + chalk.yellow(").\n\n");

            msg += chalk.gray(FS.readFileSync( PATH.resolve(__dirname, '../use.txt'), 'utf8' ));
            break;

          case HACKMYSTATUS.invalidCommand:
            msg = chalk.yellow('Invalid command: "') + chalk.yellow.bold(ex.attempted) + chalk.yellow('"');
            break;

          case HACKMYSTATUS.resumeNotFoundAlt:
            msg = chalk.yellow('Please ') + chalk.yellow.bold('feed me a resume') +
              chalk.yellow(' in either FRESH or JSON Resume format.');
            break;

          case HACKMYSTATUS.inputOutputParity:
            msg = chalk.yellow('Please ') + chalk.yellow.bold('specify an output file name') +
              chalk.yellow(' for every input file you wish to convert.');
            break;

          case HACKMYSTATUS.createNameMissing:
            msg = chalk.yellow('Please ') + chalk.yellow.bold('specify the filename of the resume') +
              chalk.yellow(' to create.');
            break;

          case HACKMYSTATUS.wkhtmltopdf:
            msg = chalk.red.bold('ERROR: PDF generation failed. ') + chalk.red('Make sure wkhtmltopdf is ' +
            'installed and accessible from your path.');
            if( ex.inner ) msg += chalk.red('\n' + ex.inner);
            break;

          case HACKMYSTATUS.invalid:
            msg = chalk.red.bold('ERROR: Validation failed and the --assert option was specified.');
            break;
        }
        exitCode = ex.fluenterror;

      }
      else {
        msg = ex.toString();
        exitCode = 4;
      }

      // Deal with pesky 'Error:' prefix.
      var idx = msg.indexOf('Error: ');
      var trimmed = idx === -1 ? msg : msg.substring( idx + 7 );

      // If this is an unhandled error, or a specific class of handled error,
      // output the error message and stack.
      if( !ex.fluenterror || ex.fluenterror < 3 ) { // TODO: magic #s
        console.log( chalk.red.bold('ERROR: ' + trimmed.toString()) );
        if( ex.code !== 'ENOENT' ) // Don't emit stack for common stuff
          console.log( chalk.gray(ex.stack) );
      }
      else {
        console.log( trimmed.toString() );
      }

      // Let the error code be the process's return code.
      if( shouldExit || ex.shouldExit )
        process.exit( exitCode );

    }

  };

}());
