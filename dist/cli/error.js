
/**
Error-handling routines for HackMyResume.
@module cli/error
@license MIT. See LICENSE.md for details.
 */

(function() {
  var ErrorHandler, FCMD, FS, HMSTATUS, M2C, PATH, PKG, SyntaxErrorEx, WRAP, YAML, _defaultLog, assembleError, chalk, extend, printf;

  HMSTATUS = require('../core/status-codes');

  PKG = require('../../package.json');

  FS = require('fs');

  FCMD = require('../index');

  PATH = require('path');

  WRAP = require('word-wrap');

  M2C = require('../utils/md2chalk');

  chalk = require('chalk');

  extend = require('extend');

  YAML = require('yamljs');

  printf = require('printf');

  SyntaxErrorEx = require('../utils/syntax-error-ex');

  require('string.prototype.startswith');


  /** Error handler for HackMyResume. All errors are handled here.
  @class ErrorHandler
   */

  ErrorHandler = module.exports = {
    init: function(debug, assert, silent) {
      this.debug = debug;
      this.assert = assert;
      this.silent = silent;
      this.msgs = require('./msg').errors;
      return this;
    },
    err: function(ex, shouldExit) {
      var o, objError, stack, stackTrace;
      o = this.silent ? function() {} : _defaultLog;
      if (ex.pass) {
        throw ex;
      }
      this.msgs = this.msgs || require('./msg').errors;
      if (ex.fluenterror) {
        objError = assembleError.call(this, ex);
        o(this['format_' + objError.etype](objError.msg));
        if (objError.withStack) {
          stack = ex.stack || (ex.inner && ex.inner.stack);
          stack && o(chalk.gray(stack));
        }
        if (shouldExit) {
          if (this.debug) {
            o(chalk.cyan('Exiting with error code ' + ex.fluenterror.toString()));
          }
          if (this.assert) {
            ex.pass = true;
            throw ex;
          }
          return process.exit(ex.fluenterror);
        }
      } else {
        o(ex);
        stackTrace = ex.stack || (ex.inner && ex.inner.stack);
        if (stackTrace && this.debug) {
          return o(M2C(ex.stack || ex.inner.stack, 'gray'));
        }
      }
    },
    format_error: function(msg) {
      msg = msg || '';
      return chalk.red.bold(msg.toUpperCase().startsWith('ERROR:') ? msg : 'Error: ' + msg);
    },
    format_warning: function(brief, msg) {
      return chalk.yellow(brief) + chalk.yellow(msg || '');
    },
    format_custom: function(msg) {
      return msg;
    }
  };

  _defaultLog = function() {
    return console.log.apply(console.log, arguments);
  };

  assembleError = function(ex) {
    var etype, msg, quit, se, withStack;
    msg = '';
    withStack = false;
    quit = false;
    etype = 'warning';
    if (this.debug) {
      withStack = true;
    }
    switch (ex.fluenterror) {
      case HMSTATUS.themeNotFound:
        msg = printf(M2C(this.msgs.themeNotFound.msg, 'yellow'), ex.data);
        break;
      case HMSTATUS.copyCSS:
        msg = M2C(this.msgs.copyCSS.msg, 'red');
        quit = false;
        break;
      case HMSTATUS.resumeNotFound:
        msg = M2C(this.msgs.resumeNotFound.msg, 'yellow');
        break;
      case HMSTATUS.missingCommand:
        msg = M2C(this.msgs.missingCommand.msg + " (", 'yellow');
        msg += Object.keys(FCMD.verbs).map(function(v, idx, ar) {
          return (idx === ar.length - 1 ? chalk.yellow('or ') : '') + chalk.yellow.bold(v.toUpperCase());
        }).join(chalk.yellow(', ')) + chalk.yellow(").\n\n");
        msg += chalk.gray(FS.readFileSync(PATH.resolve(__dirname, '../cli/use.txt'), 'utf8'));
        break;
      case HMSTATUS.invalidCommand:
        msg = printf(M2C(this.msgs.invalidCommand.msg, 'yellow'), ex.attempted);
        break;
      case HMSTATUS.resumeNotFoundAlt:
        msg = M2C(this.msgs.resumeNotFoundAlt.msg, 'yellow');
        break;
      case HMSTATUS.inputOutputParity:
        msg = M2C(this.msgs.inputOutputParity.msg);
        break;
      case HMSTATUS.createNameMissing:
        msg = M2C(this.msgs.createNameMissing.msg);
        break;
      case HMSTATUS.pdfGeneration:
        msg = M2C(this.msgs.pdfGeneration.msg, 'bold');
        if (ex.inner) {
          msg += chalk.red('\n' + ex.inner);
        }
        quit = false;
        etype = 'error';
        break;
      case HMSTATUS.invalid:
        msg = M2C(this.msgs.invalid.msg, 'red');
        etype = 'error';
        break;
      case HMSTATUS.generateError:
        msg = (ex.inner && ex.inner.toString()) || ex;
        quit = false;
        etype = 'error';
        break;
      case HMSTATUS.fileSaveError:
        msg = printf(M2C(this.msgs.fileSaveError.msg), (ex.inner || ex).toString());
        etype = 'error';
        quit = false;
        break;
      case HMSTATUS.invalidFormat:
        ex.data.forEach(function(d) {
          return msg += printf(M2C(this.msgs.invalidFormat.msg, 'bold'), ex.theme.name.toUpperCase(), d.format.toUpperCase());
        }, this);
        break;
      case HMSTATUS.missingParam:
        msg = printf(M2C(this.msgs.missingParam.msg), ex.expected, ex.helper);
        break;
      case HMSTATUS.invalidHelperUse:
        msg = printf(M2C(this.msgs.invalidHelperUse.msg), ex.helper);
        if (ex.error) {
          msg += '\n--> ' + assembleError.call(this, extend(true, {}, ex, {
            fluenterror: ex.error
          })).msg;
        }
        quit = false;
        etype = 'warning';
        break;
      case HMSTATUS.notOnPath:
        msg = printf(M2C(this.msgs.notOnPath.msg, 'bold'), ex.engine);
        quit = false;
        etype = 'error';
        break;
      case HMSTATUS.readError:
        if (!ex.quiet) {
          console.error(printf(M2C(this.msgs.readError.msg, 'red'), ex.file));
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
        msg += M2C('\n' + WRAP(ex.inner.toString(), {
          width: 60,
          indent: '   '
        }), 'gray');
        etype = 'custom';
        break;
      case HMSTATUS.compileTemplate:
        etype = 'error';
        break;
      case HMSTATUS.themeLoad:
        msg = M2C(printf(this.msgs.themeLoad.msg, ex.attempted.toUpperCase()), 'red');
        if (ex.inner && ex.inner.fluenterror) {
          msg += M2C('\nError: ', 'red') + assembleError.call(this, ex.inner).msg;
        }
        quit = true;
        etype = 'custom';
        break;
      case HMSTATUS.parseError:
        if (SyntaxErrorEx.is(ex.inner)) {
          console.error(printf(M2C(this.msgs.readError.msg, 'red'), ex.file));
          se = new SyntaxErrorEx(ex, ex.raw);
          if ((se.line != null) && (se.col != null)) {
            msg = printf(M2C(this.msgs.parseError.msg[0], 'red'), se.line, se.col);
          } else if (se.line != null) {
            msg = printf(M2C(this.msgs.parseError.msg[1], 'red'), se.line);
          } else {
            msg = M2C(this.msgs.parseError.msg[2], 'red');
          }
        } else if (ex.inner && (ex.inner.line != null) && (ex.inner.col != null)) {
          msg = printf(M2C(this.msgs.parseError.msg[0], 'red'), ex.inner.line, ex.inner.col);
        } else {
          msg = ex;
        }
        etype = 'error';
        break;
      case HMSTATUS.createError:
        msg = printf(M2C(this.msgs.createError.msg), ex.inner.path);
        etype = 'error';
        break;
      case HMSTATUS.validateError:
        msg = printf(M2C(this.msgs.validateError.msg), ex.inner.toString());
        etype = 'error';
    }
    return {
      msg: msg,
      withStack: withStack,
      quit: quit,
      etype: etype
    };
  };

}).call(this);

//# sourceMappingURL=error.js.map
