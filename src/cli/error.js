/**
Error-handling routines for HackMyResume.
@module error.js
@license MIT. See LICENSE.md for details.
*/
// TODO: Logging library


(function() {



  var HACKMYSTATUS = require('../core/status-codes')
    , PKG = require('../../package.json')
    , FS = require('fs')
    , FCMD = require('../hackmyapi')
    , PATH = require('path')
    , WRAP = require('word-wrap')
    , M2C = require('../utils/md2chalk.js')
    , chalk = require('chalk')
    , SyntaxErrorEx = require('../utils/syntax-error-ex');
    require('string.prototype.startswith');



  /**
  Error handler for HackMyResume. All errors are handled here.
  @class ErrorHandler
  */
  var ErrorHandler = module.exports = {

    init: function( debug, assert ) {
      this.debug = debug;
      this.assert = assert;
      return this;
    },

    err: function( ex, shouldExit ) {

      if( ex.pass )
        throw ex;

      if( ex.fluenterror ) {

        // Output the error message
        var objError = assembleError( ex );
        o( this[ 'format' + (objError.warning ? 'Warning' : 'Error')](
          objError.msg
        ));

        // Output the stack (sometimes)
        if( objError.showStack )
          o( chalk.red( ex.stack || ex.inner.stack ) );

        // Quit if necessary
        if( objError.quit ) {
          this.debug && o(
            chalk.cyan('Exiting with error code ' + ex.fluenterror.toString()));
          if( this.assert ) { ex.pass = true; throw ex; }
          process.exit( ex.fluenterror );
        }

      }
      else {
        o( ex );
        var stackTrace = ex.stack || (ex.inner && ex.inner.stack);
        if( stackTrace && this.debug )
          o( ex.stack || ex.inner.stack );
        // if( this.debug )
        //   o( ex.stack || ex.inner.stack );
      }

    },

    formatError: function( msg ) {
      return chalk.red.bold(
        msg.toUpperCase().startsWith('ERROR:') ? msg : 'Error: ' + msg );
    },

    formatWarning: function( brief, msg ) {
      return chalk.yellow(brief) + chalk.yellow(msg || '');
    }

  };


  var o = function() {
    console.log.apply( console.log, arguments );
  };

  function assembleError( ex ) {

    var msg = '', withStack = false, isError = false, quit = true, warn = true;

    switch( ex.fluenterror ) {

      case HACKMYSTATUS.themeNotFound:
        msg =
           chalk.bold("Couldn't find the '" + ex.data + "' theme."),
          " Please specify the name of a preinstalled FRESH theme " +
          "or the path to a locally installed FRESH or JSON Resume theme.";
        break;

      case HACKMYSTATUS.copyCSS:
        msg = "Couldn't copy CSS file to destination folder.";
        quit = false;
        break;

      case HACKMYSTATUS.resumeNotFound:
        msg = 'Please ' + chalk.bold('feed me a resume') +
          ' in FRESH or JSON Resume format.';
        break;

      case HACKMYSTATUS.missingCommand:
        msg = "Please " +chalk.bold("give me a command") + " (";

        msg += Object.keys( FCMD.verbs ).map( function(v, idx, ar) {
          return (idx === ar.length - 1 ? chalk.yellow('or ') : '') +
            chalk.yellow.bold(v.toUpperCase());
        }).join( chalk.yellow(', ')) + chalk.yellow(").\n\n");

        msg += chalk.gray(FS.readFileSync(
          PATH.resolve(__dirname, '../cli/use.txt'), 'utf8' ));
        break;

      case HACKMYSTATUS.invalidCommand:
        msg = 'Invalid command: "'+chalk.bold(ex.attempted)+'"';
        break;

      case HACKMYSTATUS.resumeNotFoundAlt:
        msg = 'Please ' + chalk.bold('feed me a resume') +
          ' in either FRESH or JSON Resume format.';
        break;

      case HACKMYSTATUS.inputOutputParity:
        msg = 'Please ' +
          chalk.bold('specify an output file name') +
          ' for every input file you wish to convert.';
        break;

      case HACKMYSTATUS.createNameMissing:
        msg = 'Please ' +
          chalk.bold('specify the filename of the resume') + ' to create.';
        break;

      case HACKMYSTATUS.pdfGeneration:
        msg = chalk.bold('PDF generation failed. ') +
          'Make sure wkhtmltopdf is installed and accessible from your path.';
        if( ex.inner ) msg += chalk.red('\n' + ex.inner);
        withStack = true; quit = false; warn = false;
        break;

      case HACKMYSTATUS.invalid:
        msg = 'Validation failed and the --assert option was ' +
          'specified.';
        warn = false;
        break;

      case HACKMYSTATUS.invalidFormat:
        ex.data.forEach(function(d){ msg +=
          'The ' + chalk.bold(ex.theme.name.toUpperCase()) +
          " theme doesn't support the " + chalk.bold(d.format.toUpperCase()) +
          " format.\n";
        });
        break;

      case HACKMYSTATUS.notOnPath:
        msg =  ex.engine + " wasn't found on your system path or" +
          " is inaccessible. PDF not generated.";
        quit = false;
        warn = false;
        break;

      case HACKMYSTATUS.readError:
        msg = ex.inner.toString();
        warn = false;
        break;

      case HACKMYSTATUS.parseError:
        if( SyntaxErrorEx.is( ex.inner )) {
          var se = new SyntaxErrorEx( ex, ex.raw );
          msg = 'Invalid or corrupt JSON on line ' + se.line +
            ' column ' + se.col + '.';
        }
        else {
          msg = ex;
        }
        warn = false;
        break;

    }

    return {
      warning: warn,         // True if this is a warning, false if error
      msg: msg,              // The error message to display
      withStack: withStack,  // Whether to include the stack
      quit: quit
    };
  }




}());
