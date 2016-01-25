/**
Error-handling routines for HackMyResume.
@module cli/error
@license MIT. See LICENSE.md for details.
*/



(function() {



  var HMSTATUS = require('hackmycore/src/core/status-codes')
    , PKG = require('../../package.json')
    , FS = require('fs')
    , FCMD = require('hackmycore')
    , PATH = require('path')
    , WRAP = require('word-wrap')
    , M2C = require('hackmycore/src/utils/md2chalk.js')
    , chalk = require('chalk')
    , extend = require('extend')
    , YAML = require('yamljs')
    , printf = require('printf')
    , SyntaxErrorEx = require('hackmycore/src/utils/syntax-error-ex');
    require('string.prototype.startswith');



  /**
  Error handler for HackMyResume. All errors are handled here.
  @class ErrorHandler
  */
  var ErrorHandler = module.exports = {



    init: function( debug, assert, silent ) {
      this.debug = debug;
      this.assert = assert;
      this.silent = silent;
      this.msgs = require('./msg.js').errors;
      return this;
    },



    err: function( ex, shouldExit ) {

      // Short-circuit logging output if --silent is on
      var o = this.silent ? function() { } : _defaultLog;

      // Special case; can probably be removed.
      if( ex.pass ) throw ex;

      // Load error messages
      this.msgs = this.msgs || require('./msg.js').errors;

      // Handle packaged HMR exceptions
      if( ex.fluenterror ) {

        // Output the error message
        var objError = assembleError.call( this, ex );
        o( this[ 'format_' + objError.etype ]( objError.msg ));

        // Output the stack (sometimes)
        if( objError.withStack ) {
          var stack = ex.stack || (ex.inner && ex.inner.stack);
          stack && o( chalk.gray( stack ) );
        }

        // Quit if necessary
        if( ex.quit || objError.quit ) {
          this.debug && o(
            chalk.cyan('Exiting with error code ' + ex.fluenterror.toString()));
          if( this.assert ) { ex.pass = true; throw ex; }
          process.exit( ex.fluenterror );
        }

      }

      // Handle raw exceptions
      else {
        o( ex );
        var stackTrace = ex.stack || (ex.inner && ex.inner.stack);
        if( stackTrace && this.debug )
          o( M2C(ex.stack || ex.inner.stack, 'gray') );
      }

    },



    format_error: function( msg ) {
      msg = msg || '';
      return chalk.red.bold(
        msg.toUpperCase().startsWith('ERROR:') ? msg : 'Error: ' + msg );
    },



    format_warning: function( brief, msg ) {
      return chalk.yellow(brief) + chalk.yellow(msg || '');
    },


    format_custom: function( msg ) {
      return msg;
    }



  };



  function _defaultLog() {
    console.log.apply( console.log, arguments );
  }



  function assembleError( ex ) {

    var msg = '', withStack = false, quit = false, etype = 'warning';
    if( this.debug ) withStack = true;

    switch( ex.fluenterror ) {

      case HMSTATUS.themeNotFound:
        msg = printf( M2C( this.msgs.themeNotFound.msg, 'yellow' ), ex.data);
        break;

      case HMSTATUS.copyCSS:
        msg = M2C( this.msgs.copyCSS.msg, 'red' );
        quit = false;
        break;

      case HMSTATUS.resumeNotFound:
        msg = M2C( this.msgs.resumeNotFound.msg, 'yellow' );
        break;

      case HMSTATUS.missingCommand:
        msg = M2C( this.msgs.missingCommand.msg + " (", 'yellow');
        msg += Object.keys( FCMD.verbs ).map( function(v, idx, ar) {
          return (idx === ar.length - 1 ? chalk.yellow('or ') : '') +
            chalk.yellow.bold(v.toUpperCase());
        }).join( chalk.yellow(', ')) + chalk.yellow(").\n\n");

        msg += chalk.gray(FS.readFileSync(
          PATH.resolve(__dirname, '../cli/use.txt'), 'utf8' ));
        break;

      case HMSTATUS.invalidCommand:
        msg = printf( M2C( this.msgs.invalidCommand.msg, 'yellow'), ex.attempted );
        break;

      case HMSTATUS.resumeNotFoundAlt:
        msg = M2C( this.msgs.resumeNotFoundAlt.msg, 'yellow' );
        break;

      case HMSTATUS.inputOutputParity:
        msg = M2C( this.msgs.inputOutputParity.msg );
        break;

      case HMSTATUS.createNameMissing:
        msg = M2C( this.msgs.createNameMissing.msg );
        break;

      case HMSTATUS.pdfGeneration:
        msg = M2C( this.msgs.pdfGeneration.msg, 'bold' );
        if( ex.inner ) msg += chalk.red('\n' + ex.inner);
        withStack = true; quit = false; etype = 'error';
        break;

      case HMSTATUS.invalid:
        msg = M2C( this.msgs.invalid.msg, 'red' );
        etype = 'error';
        break;

      case HMSTATUS.generateError:
        msg = (ex.inner && ex.inner.toString()) || ex;
        quit = false;
        etype = 'error';
        break;

      case HMSTATUS.fileSaveError:
        msg = printf( M2C( this.msgs.fileSaveError.msg ), (ex.inner || ex).toString() );
        etype = 'error';
        quit = false;
        break;

      case HMSTATUS.invalidFormat:
        ex.data.forEach(function(d){
          msg += printf( M2C( this.msgs.invalidFormat.msg, 'bold' ),
            ex.theme.name.toUpperCase(), d.format.toUpperCase());
        }, this);
        break;

      case HMSTATUS.missingParam:
        msg = printf( M2C( this.msgs.missingParam.msg ), ex.expected, ex.helper );
        break;

      case HMSTATUS.invalidHelperUse:
        msg = printf( M2C( this.msgs.invalidHelperUse.msg ), ex.helper );
        if( ex.error ) {
          msg += '\n--> ' + assembleError.call( this, extend( true, {}, ex, {fluenterror: ex.error} )).msg;
          //msg += printf( '\n--> ' + M2C( this.msgs.invalidParamCount.msg ), ex.expected );
        }
        quit = false;
        etype = 'warning';
        break;

      case HMSTATUS.notOnPath:
        msg = printf( M2C(this.msgs.notOnPath.msg, 'bold'), ex.engine);
        quit = false;
        etype = 'error';
        break;

      case HMSTATUS.readError:
        if( !ex.quiet )
          console.error(printf( M2C(this.msgs.readError.msg, 'red'), ex.file));
        msg = ex.inner.toString();
        etype = 'error';
        break;

      case HMSTATUS.mixedMerge:
        msg = M2C( this.msgs.mixedMerge.msg );
        quit = false;
        break;

      case HMSTATUS.invokeTemplate:
        msg = M2C( this.msgs.invokeTemplate.msg, 'red' );
        msg += M2C( '\n' + WRAP(ex.inner.toString(), { width: 60, indent: '   ' }), 'gray' );
        etype = 'custom';
        break;

      case HMSTATUS.compileTemplate:
        etype = 'error';
        break;

      case HMSTATUS.themeLoad:
        msg = M2C( printf( this.msgs.themeLoad.msg, ex.attempted.toUpperCase() ), 'red');
        if( ex.inner && ex.inner.fluenterror ) {
          msg += M2C('\nError: ', 'red') + assembleError.call( this, ex.inner ).msg;
        }
        quit = true;
        etype = 'custom';
        break;

      case HMSTATUS.parseError:
        if( SyntaxErrorEx.is( ex.inner )) {
          console.error( printf( M2C(this.msgs.readError.msg, 'red'), ex.file ) );
          var se = new SyntaxErrorEx( ex, ex.raw );
          msg = printf( M2C( this.msgs.parseError.msg, 'red' ),
            se.line, se.col);
        }
        else if( ex.inner && ex.inner.line !== undefined && ex.inner.col !== undefined ) {
          msg = printf( M2C( this.msgs.parseError.msg, 'red' ),
            ex.inner.line, ex.inner.col);
        }
        else {
          msg = ex;
        }
        etype = 'error';
        break;

    }

    return {
      msg: msg,              // The error message to display
      withStack: withStack,  // Whether to include the stack
      quit: quit,
      etype: etype
    };
  }




}());
