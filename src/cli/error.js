/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Error-handling routines for HackMyResume.
@module cli/error
@license MIT. See LICENSE.md for details.
*/



const HMSTATUS = require('../core/status-codes');
const FS = require('fs');
const PATH = require('path');
const WRAP = require('word-wrap');
const M2C = require('../utils/md2chalk');
const chalk = require('chalk');
const extend = require('extend');
const printf = require('printf');
const SyntaxErrorEx = require('../utils/syntax-error-ex');
require('string.prototype.startswith');



/** Error handler for HackMyResume. All errors are handled here.
@class ErrorHandler */
module.exports = {

  init( debug, assert, silent ) {
    this.debug = debug;
    this.assert = assert;
    this.silent = silent;
    this.msgs = require('./msg').errors;
    return this;
  },

  err( ex, shouldExit ) {

    // Short-circuit logging output if --silent is on
    let stack;
    const o = this.silent ? function() {} : _defaultLog;

    // Special case; can probably be removed.
    if (ex.pass) { throw ex; }

    // Load error messages
    this.msgs = this.msgs || require('./msg').errors;

    // Handle packaged HMR exceptions
    if (ex.fluenterror) {

      // Output the error message
      const objError = assembleError.call(this, ex);
      o( this[ `format_${objError.etype}` ]( objError.msg ));

      // Output the stack (sometimes)
      if (objError.withStack) {
        stack = ex.stack || (ex.inner && ex.inner.stack);
        stack && o( chalk.gray( stack ) );
      }

      // Quit if necessary
      if (shouldExit || ex.exit) {
        if (this.debug) {
          o(chalk.cyan(`Exiting with error code ${ex.fluenterror.toString()}`));
        }
        if (this.assert) {
          ex.pass = true;
          throw ex;
        }
        return process.exit(ex.fluenterror);
      }

    // Handle raw exceptions
    } else {
      o(ex);
      const stackTrace = ex.stack || (ex.inner && ex.inner.stack);
      if (stackTrace && this.debug) {
        return o(M2C(ex.stack || ex.inner.stack, 'gray'));
      }
    }
  },



  format_error( msg ) {
    msg = msg || '';
    return chalk.red.bold( msg.toUpperCase().startsWith('ERROR:') ? msg : `Error: ${msg}` );
  },


  format_warning( brief, msg ) {
    return chalk.yellow(brief) + chalk.yellow(msg || '');
  },


  format_custom( msg ) { return msg; }
};


var _defaultLog = function() { return console.log.apply(console.log, arguments); }; // eslint-disable-line no-console




var assembleError = function( ex ) {

  let se;
  let msg = '';
  let withStack = false;
  let quit = false;
  let etype = 'warning';
  if (this.debug) { withStack = true; }

  switch (ex.fluenterror) {

    case HMSTATUS.themeNotFound:
      msg = printf( M2C( this.msgs.themeNotFound.msg, 'yellow' ), ex.data);
      break;

    case HMSTATUS.copyCSS:
      msg = M2C( this.msgs.copyCSS.msg, 'red' );
      quit = false;
      break;

    case HMSTATUS.resumeNotFound:
      //msg = M2C( this.msgs.resumeNotFound.msg, 'yellow' );
      msg += M2C(FS.readFileSync(
        PATH.resolve(__dirname, `help/${ex.verb}.txt`), 'utf8' ), 'white', 'yellow');
      break;

    case HMSTATUS.missingCommand:
      // msg = M2C( this.msgs.missingCommand.msg + " (", 'yellow');
      // msg += Object.keys( FCMD.verbs ).map( (v, idx, ar) ->
      //   return ( if idx == ar.length - 1 then chalk.yellow('or ') else '') +
      //     chalk.yellow.bold(v.toUpperCase());
      // ).join( chalk.yellow(', ')) + chalk.yellow(").\n\n");

      msg += M2C(FS.readFileSync(
        PATH.resolve(__dirname, 'help/use.txt'), 'utf8' ), 'white', 'yellow');
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
      if (ex.inner) { msg += chalk.red(`\n${ex.inner}`); }
      quit = false;
      etype = 'error';
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
      ex.data.forEach( function(d) {
        return msg += printf( M2C( this.msgs.invalidFormat.msg, 'bold' ),
          ex.theme.name.toUpperCase(), d.format.toUpperCase());
      }
      , this);
      break;

    case HMSTATUS.missingParam:
      msg = printf(M2C( this.msgs.missingParam.msg ), ex.expected, ex.helper);
      break;

    case HMSTATUS.invalidHelperUse:
      msg = printf( M2C( this.msgs.invalidHelperUse.msg ), ex.helper );
      if (ex.error) {
        msg += `\n--> ${assembleError.call( this, extend( true, {}, ex, {fluenterror: ex.error} )).msg}`;
      }
        //msg += printf( '\n--> ' + M2C( this.msgs.invalidParamCount.msg ), ex.expected );
      quit = false;
      etype = 'warning';
      break;

    case HMSTATUS.notOnPath:
      msg = printf( M2C(this.msgs.notOnPath.msg, 'bold'), ex.engine);
      quit = false;
      etype = 'error';
      break;

    case HMSTATUS.readError:
      if (!ex.quiet) {
        // eslint-disable-next-line no-console
        console.error(printf( M2C(this.msgs.readError.msg, 'red'), ex.file));
      }
      msg = ex.inner.toString();
      etype = 'error';
      break;

    case HMSTATUS.mixedMerge:
      msg = M2C(this.msgs.mixedMerge.msg);
      quit = false;
      break;

    case HMSTATUS.invokeTemplate:
      msg = M2C(this.msgs.invokeTemplate.msg, 'red');
      msg += M2C( `\n${WRAP(ex.inner.toString(), { width: 60, indent: '   ' })}`, 'gray' );
      etype = 'custom';
      break;

    case HMSTATUS.compileTemplate:
      etype = 'error';
      break;

    case HMSTATUS.themeLoad:
      msg = M2C( printf( this.msgs.themeLoad.msg, ex.attempted.toUpperCase() ), 'red');
      if (ex.inner && ex.inner.fluenterror) {
        msg += M2C('\nError: ', 'red') + assembleError.call( this, ex.inner ).msg;
      }
      quit = true;
      etype = 'custom';
      break;

    case HMSTATUS.parseError:
      if (SyntaxErrorEx.is(ex.inner)) {
        // eslint-disable-next-line no-console
        console.error(printf( M2C(this.msgs.readError.msg, 'red'), ex.file ));
        se = new SyntaxErrorEx(ex, ex.raw);
        if ((se.line != null) && (se.col != null)) {
          msg = printf(M2C( this.msgs.parseError.msg[0], 'red' ), se.line, se.col);
        } else if (se.line != null) {
          msg = printf(M2C( this.msgs.parseError.msg[1], 'red' ), se.line);
        } else {
          msg = M2C(this.msgs.parseError.msg[2], 'red');
        }
      } else if (ex.inner && (ex.inner.line != null) && (ex.inner.col != null)) {
        msg = printf( M2C( this.msgs.parseError.msg[0], 'red' ), ex.inner.line, ex.inner.col);
      } else {
        msg = ex;
      }
      etype = 'error';
      break;

    case HMSTATUS.createError:
      // inner.code could be EPERM, EACCES, etc
      msg = printf(M2C( this.msgs.createError.msg ), ex.inner.path);
      etype = 'error';
      break;

    case HMSTATUS.validateError:
      msg = printf(M2C( this.msgs.validateError.msg ), ex.inner.toString());
      etype = 'error';
      break;

    case HMSTATUS.invalidOptionsFile:
      msg = M2C(this.msgs.invalidOptionsFile.msg[0]);
      if (SyntaxErrorEx.is(ex.inner)) {
        // eslint-disable-next-line no-console
        console.error(printf( M2C(this.msgs.readError.msg, 'red'), ex.file ));
        se = new SyntaxErrorEx(ex, ex.raw);
        if ((se.line != null) && (se.col != null)) {
          msg += printf(M2C( this.msgs.parseError.msg[0], 'red' ), se.line, se.col);
        } else if (se.line != null) {
          msg += printf(M2C( this.msgs.parseError.msg[1], 'red' ), se.line);
        } else {
          msg += M2C(this.msgs.parseError.msg[2], 'red');
        }
      } else if (ex.inner && (ex.inner.line != null) && (ex.inner.col != null)) {
        msg += printf( M2C( this.msgs.parseError.msg[0], 'red' ), ex.inner.line, ex.inner.col);
      } else {
        msg += ex;
      }
      msg += this.msgs.invalidOptionsFile.msg[1];
      etype = 'error';
      break;

    case HMSTATUS.optionsFileNotFound:
      msg = M2C( this.msgs.optionsFileNotFound.msg );
      etype = 'error';
      break;

    case HMSTATUS.unknownSchema:
      msg = M2C( this.msgs.unknownSchema.msg[0] );
      //msg += "\n" + M2C( @msgs.unknownSchema.msg[1], 'yellow' )
      etype = 'error';
      break;

    case HMSTATUS.themeHelperLoad:
      msg = printf(M2C( this.msgs.themeHelperLoad.msg ), ex.glob);
      etype = 'error';
      break;

    case HMSTATUS.invalidSchemaVersion:
      msg = printf(M2C( this.msgs.invalidSchemaVersion.msg ), ex.data);
      etype = 'error';
      break;
  }

  return {
    msg,              // The error message to display
    withStack,  // Whether to include the stack
    quit,
    etype
  };
};
