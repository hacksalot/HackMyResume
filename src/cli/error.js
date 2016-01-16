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
    , YAML = require('yamljs')
    , printf = require('printf')
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
      this.msgs = require('./msg.js').errors;
      return this;
    },

    err: function( ex, shouldExit ) {

      if( !this.msgs ) {
        this.msgs = require('./msg.js').errors;
      }

      if( ex.pass )
        throw ex;

      if( ex.fluenterror ) {

        // Output the error message
        var objError = assembleError.call( this, ex );
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
        msg = printf( M2C( this.msgs.themeNotFound.msg, 'yellow' ), ex.data);
        break;

      case HACKMYSTATUS.copyCSS:
        msg = M2C( this.msgs.copyCSS.msg, 'red' );
        quit = false;
        break;

      case HACKMYSTATUS.resumeNotFound:
        msg = M2C( this.msgs.resumeNotFound.msg, 'yellow' );
        break;

      case HACKMYSTATUS.missingCommand:
        msg = M2C( this.msgs.missingCommand.msg + " (", 'yellow');
        msg += Object.keys( FCMD.verbs ).map( function(v, idx, ar) {
          return (idx === ar.length - 1 ? chalk.yellow('or ') : '') +
            chalk.yellow.bold(v.toUpperCase());
        }).join( chalk.yellow(', ')) + chalk.yellow(").\n\n");

        msg += chalk.gray(FS.readFileSync(
          PATH.resolve(__dirname, '../cli/use.txt'), 'utf8' ));
        break;

      case HACKMYSTATUS.invalidCommand:
        msg = printf( M2C( this.msgs.invalidCommand.msg, 'yellow'), ex.attempted );
        break;

      case HACKMYSTATUS.resumeNotFoundAlt:
        msg = M2C( this.msgs.resumeNotFoundAlt.msg, 'yellow' );
        break;

      case HACKMYSTATUS.inputOutputParity:
        msg = M2C( this.msgs.inputOutputParity.msg );
        break;

      case HACKMYSTATUS.createNameMissing:
        msg = M2C( this.msgs.createNameMissing.msg );
        break;

      case HACKMYSTATUS.pdfGeneration:
        msg = M2C( this.msgs.pdfGeneration.msg, 'bold' );
        if( ex.inner ) msg += chalk.red('\n' + ex.inner);
        withStack = true; quit = false; warn = false;
        break;

      case HACKMYSTATUS.invalid:
        msg = M2C( this.msgs.invalid.msg, 'red' );
        warn = false;
        break;

      case HACKMYSTATUS.invalidFormat:
        ex.data.forEach(function(d){
          msg += printf( M2C( this.msgs.invalidFormat.msg, 'bold' ),
            ex.theme.name.toUpperCase(), d.format.toUpperCase());
        });
        break;

      case HACKMYSTATUS.notOnPath:
        msg = printf( M2C(this.msgs.notOnPath, 'bold'), ex.engine);
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
          msg = printf( M2C( this.msgs.parseError.msg, 'red' ),
            se.line, se.col);
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
