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
    , WRAP = require('word-wrap')
    , chalk = require('chalk');



  /**
  An amorphous blob of error handling code for HackMyResume.
  @class ErrorHandler
  */
  var ErrorHandler = module.exports = {



    err: function( ex, shouldExit ) {

      var msg = '', exitCode, log = console.log, showStack = ex.showStack;

      // If the exception has been handled elsewhere and shouldExit is true,
      // let's get out of here, otherwise silently return.
      if( ex.handled ) {
        if( shouldExit )
          process.exit( exitCode );
        return;
      }

      // Get an error message -- either a HackMyResume error message or the
      // exception's associated error message
      if( ex.fluenterror ){
        var errInfo = get_error_msg( ex );
        msg = errInfo.msg;
        exitCode = ex.fluenterror;
        showStack = errInfo.showStack;
      }
      else {
        msg = ex.toString();
        exitCode = -1;
        // Deal with pesky 'Error:' prefix.
        var idx = msg.indexOf('Error: ');
        msg = idx === -1 ? msg : msg.substring( idx + 7 );
      }

      // Log non-HackMyResume-handled errors in red with ERROR prefix. Log HMR
      // errors as-is.
      ex.fluenterror ?
        log( msg.toString() ) :
        log( chalk.red.bold('ERROR: ' + msg.toString()) );

      // Usually emit the stack
      ( showStack && ex.code !== 'ENOENT' ) && log( chalk.gray(ex.stack) );

      // Let the error code be the process's return code.
      ( shouldExit || ex.shouldExit ) && process.exit( exitCode );
    }

  };



  function get_error_msg( ex ) {

    var msg = '', withStack = false, isError = false;
    switch( ex.fluenterror ) {

      case HACKMYSTATUS.themeNotFound:
        msg = formatWarning(
           chalk.bold("Couldn't find the '" + ex.data + "' theme."),
          " Please specify the name of a preinstalled FRESH theme " +
          "or the path to a locally installed FRESH or JSON Resume theme.");
        break;

      case HACKMYSTATUS.copyCSS:
        msg = formatWarning("Couldn't copy CSS file to destination folder.");
        break;

      case HACKMYSTATUS.resumeNotFound:
        msg = formatWarning('Please ' + chalk.bold('feed me a resume') +
          ' in FRESH or JSON Resume format.');
        break;

      case HACKMYSTATUS.missingCommand:
        msg = formatWarning("Please " +chalk.bold("give me a command") + " (");

        msg += Object.keys( FCMD.verbs ).map( function(v, idx, ar) {
          return (idx === ar.length - 1 ? chalk.yellow('or ') : '') +
            chalk.yellow.bold(v.toUpperCase());
        }).join( chalk.yellow(', ')) + chalk.yellow(").\n\n");

        msg += chalk.gray(FS.readFileSync(
          PATH.resolve(__dirname, '../use.txt'), 'utf8' ));
        break;

      case HACKMYSTATUS.invalidCommand:
        msg = formatWarning('Invalid command: "'+chalk.bold(ex.attempted)+'"');
        break;

      case HACKMYSTATUS.resumeNotFoundAlt:
        msg = formatWarning('Please ' + chalk.bold('feed me a resume') +
          ' in either FRESH or JSON Resume format.');
        break;

      case HACKMYSTATUS.inputOutputParity:
        msg = formatWarning('Please ' +
          chalk.bold('specify an output file name') +
          ' for every input file you wish to convert.');
        break;

      case HACKMYSTATUS.createNameMissing:
        msg = formatWarning('Please ' +
          chalk.bold('specify the filename of the resume') + ' to create.');
        break;

      case HACKMYSTATUS.pdfGeneration:
        msg = formatError(chalk.bold('ERROR: PDF generation failed. ') +
          'Make sure wkhtmltopdf is installed and accessible from your path.');
        if( ex.inner ) msg += chalk.red('\n' + ex.inner);
        withStack = true;
        break;

      case HACKMYSTATUS.invalid:
        msg = formatError('Validation failed and the --assert option was ' +
          'specified.');
        break;

      case HACKMYSTATUS.invalidFormat:
        ex.data.forEach(function(d){ msg +=
          formatWarning('The ' + chalk.bold(ex.theme.name.toUpperCase()) +
          " theme doesn't support the " + chalk.bold(d.format.toUpperCase()) +
          " format.\n");
        });
        break;

      case HACKMYSTATUS.notOnPath:
        msg = formatError( ex.engine + " wasn't found on your system path or" +
          " is inaccessible. PDF not generated." );
        break;

    }
    return {
      msg: msg,
      withStack: withStack
    };
  }

  function formatError( msg ) {
    return chalk.red.bold( 'ERROR: ' + msg );
  }

  function formatWarning( brief, msg ) {
    return chalk.yellow(brief) + chalk.yellow(msg || '');
  }


}());
