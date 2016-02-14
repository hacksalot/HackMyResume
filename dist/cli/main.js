
/**
Definition of the `main` function.
@module cli/main
@license MIT. See LICENSE.md for details.
 */

(function() {
  var Command, EXTEND, FS, HME, HMR, HMSTATUS, M2C, OUTPUT, PAD, PATH, PKG, StringUtils, _, _err, _exitCallback, _opts, _out, _title, chalk, execute, executeFail, executeSuccess, initOptions, initialize, loadOptions, logMsg, main, printf, safeLoadJSON, splitSrcDest;

  HMR = require('../index');

  PKG = require('../../package.json');

  FS = require('fs');

  EXTEND = require('extend');

  chalk = require('chalk');

  PATH = require('path');

  HMSTATUS = require('../core/status-codes');

  HME = require('../core/event-codes');

  safeLoadJSON = require('../utils/safe-json-loader');

  StringUtils = require('../utils/string.js');

  _ = require('underscore');

  OUTPUT = require('./out');

  PAD = require('string-padding');

  Command = require('commander').Command;

  M2C = require('../utils/md2chalk');

  printf = require('printf');

  _opts = {};

  _title = chalk.white.bold('\n*** HackMyResume v' + PKG.version + ' ***');

  _out = new OUTPUT(_opts);

  _err = require('./error');

  _exitCallback = null;


  /*
  A callable implementation of the HackMyResume CLI. Encapsulates the command
  line interface as a single method accepting a parameter array.
  @alias module:cli/main.main
  @param rawArgs {Array} An array of command-line parameters. Will either be
  process.argv (in production) or custom parameters (in test).
   */

  main = module.exports = function(rawArgs, exitCallback) {
    var args, initInfo, program;
    initInfo = initialize(rawArgs, exitCallback);
    args = initInfo.args;
    program = new Command('hackmyresume').version(PKG.version).description(chalk.yellow.bold('*** HackMyResume ***')).option('-s --silent', 'Run in silent mode').option('--no-color', 'Disable colors').option('--color', 'Enable colors').option('-d --debug', 'Enable diagnostics', false).option('-a --assert', 'Treat warnings as errors', false).option('-v --version', 'Show the version').allowUnknownOption();
    program.jsonArgs = initInfo.options;
    program.command('new')["arguments"]('<sources...>').option('-f --format <fmt>', 'FRESH or JRS format', 'FRESH').alias('create').description('Create resume(s) in FRESH or JSON RESUME format.').action((function(sources) {
      execute.call(this, sources, [], this.opts(), logMsg);
    }));
    program.command('validate')["arguments"]('<sources...>').description('Validate a resume in FRESH or JSON RESUME format.').action(function(sources) {
      execute.call(this, sources, [], this.opts(), logMsg);
    });
    program.command('convert').description('Convert a resume to/from FRESH or JSON RESUME format.').action(function() {
      var x;
      x = splitSrcDest.call(this);
      execute.call(this, x.src, x.dst, this.opts(), logMsg);
    });
    program.command('analyze')["arguments"]('<sources...>').description('Analyze one or more resumes.').action(function(sources) {
      execute.call(this, sources, [], this.opts(), logMsg);
    });
    program.command('peek')["arguments"]('<sources...>').description('Peek at a resume field or section').action(function(sources, sectionOrField) {
      var dst;
      dst = sources && sources.length > 1 ? [sources.pop()] : [];
      execute.call(this, sources, dst, this.opts(), logMsg);
    });
    program.command('build').alias('generate').option('-t --theme <theme>', 'Theme name or path').option('-n --no-prettify', 'Disable HTML prettification', true).option('-c --css <option>', 'CSS linking / embedding').option('-p --pdf <engine>', 'PDF generation engine').option('--no-sort', 'Sort resume sections by date', false).option('--tips', 'Display theme tips and warnings.', false).description('Generate resume to multiple formats').action(function(sources, targets, options) {
      var x;
      x = splitSrcDest.call(this);
      execute.call(this, x.src, x.dst, this.opts(), logMsg);
    });
    program.parse(args);
    if (!program.args.length) {
      throw {
        fluenterror: 4
      };
    }
  };


  /* Massage command-line args and setup Commander.js. */

  initialize = function(ar, exitCallback) {
    var o;
    _exitCallback = exitCallback || process.exit;
    o = initOptions(ar);
    o.silent || logMsg(_title);
    if (o.debug) {
      _out.log(chalk.cyan('The -d or --debug switch was specified. DEBUG mode engaged.'));
      _out.log('');
      _out.log(chalk.cyan(PAD('  Platform:', 25, null, PAD.RIGHT)) + chalk.cyan.bold(process.platform === 'win32' ? 'windows' : process.platform));
      _out.log(chalk.cyan(PAD('  Node.js:', 25, null, PAD.RIGHT)) + chalk.cyan.bold(process.version));
      _out.log(chalk.cyan(PAD('  HackMyResume:', 25, null, PAD.RIGHT)) + chalk.cyan.bold('v' + PKG.version));
      _out.log(chalk.cyan(PAD('  FRESCA:', 25, null, PAD.RIGHT)) + chalk.cyan.bold(PKG.dependencies.fresca));
      _out.log('');
    }
    _err.init(o.debug, o.assert, o.silent);
    if (o.verb && !HMR.verbs[o.verb] && !HMR.alias[o.verb]) {
      _err.err({
        fluenterror: HMSTATUS.invalidCommand,
        quit: true,
        attempted: o.orgVerb
      }, true);
    }
    Command.prototype.missingArgument = function(name) {
      _err.err({
        fluenterror: this.name() !== 'new' ? HMSTATUS.resumeNotFound : HMSTATUS.createNameMissing
      }, true);
    };
    Command.prototype.helpInformation = function() {
      var manPage;
      manPage = FS.readFileSync(PATH.join(__dirname, 'use.txt'), 'utf8');
      return chalk.green.bold(manPage);
    };
    return {
      args: o.args,
      options: o.json
    };
  };


  /* Init options prior to setting up command infrastructure. */

  initOptions = function(ar) {
    oVerb;
    var args, cleanArgs, inf, isAssert, isDebug, isMono, isSilent, oJSON, oVerb, optStr, optsIdx, verb, vidx;
    verb = '';
    args = ar.slice();
    cleanArgs = args.slice(2);
    oJSON;
    if (cleanArgs.length) {
      vidx = _.findIndex(cleanArgs, function(v) {
        return v[0] !== '-';
      });
      if (vidx !== -1) {
        oVerb = cleanArgs[vidx];
        verb = args[vidx + 2] = oVerb.trim().toLowerCase();
      }
      optsIdx = _.findIndex(cleanArgs, function(v) {
        return v === '-o' || v === '--options' || v === '--opts';
      });
      if (optsIdx !== -1) {
        optStr = cleanArgs[optsIdx + 1];
        args.splice(optsIdx + 2, 2);
        if (optStr && (optStr = optStr.trim())) {
          if (optStr[0] === '{') {

            /* jshint ignore:start */
            oJSON = eval('(' + optStr + ')');

            /* jshint ignore:end */
          } else {
            inf = safeLoadJSON(optStr);
            if (!inf.ex) {
              oJSON = inf.json;
            }
          }
        }
      }
    }
    isDebug = _.some(args, function(v) {
      return v === '-d' || v === '--debug';
    });
    isSilent = _.some(args, function(v) {
      return v === '-s' || v === '--silent';
    });
    isAssert = _.some(args, function(v) {
      return v === '-a' || v === '--assert';
    });
    isMono = _.some(args, function(v) {
      return v === '--no-color';
    });
    return {
      color: !isMono,
      debug: isDebug,
      silent: isSilent,
      assert: isAssert,
      orgVerb: oVerb,
      verb: verb,
      json: oJSON,
      args: args
    };
  };


  /* Invoke a HackMyResume verb. */

  execute = function(src, dst, opts, log) {
    var prom, v;
    v = new HMR.verbs[this.name()]();
    loadOptions.call(this, opts, this.parent.jsonArgs);
    _opts.errHandler = v;
    _out.init(_opts);
    v.on('hmr:status', function() {
      return _out["do"].apply(_out, arguments);
    });
    v.on('hmr:error', function() {
      return _err.err.apply(_err, arguments);
    });
    prom = v.invoke.call(v, src, dst, _opts, log);
    prom.then(executeSuccess, executeFail);
  };


  /* Success handler for verb invocations. Calls process.exit by default */

  executeSuccess = function(obj) {};


  /* Failure handler for verb invocations. Calls process.exit by default */

  executeFail = function(err) {
    var finalErrorCode, msgs;
    finalErrorCode = -1;
    if (err) {
      finalErrorCode = err.fluenterror ? err.fluenterror : err;
    }
    if (_opts.debug) {
      msgs = require('./msg').errors;
      logMsg(printf(M2C(msgs.exiting.msg, 'cyan'), finalErrorCode));
      if (err.stack) {
        logMsg(err.stack);
      }
    }
    _exitCallback(finalErrorCode);
  };


  /*
  Initialize HackMyResume options.
  TODO: Options loading is a little hacky, for two reasons:
    - Commander.js idiosyncracies
    - Need to accept JSON inputs from the command line.
   */

  loadOptions = function(o, cmdO) {
    if (cmdO) {
      o = EXTEND(true, o, cmdO);
    }
    o = EXTEND(true, o, this.opts());
    if (this.parent.silent !== void 0 && this.parent.silent !== null) {
      o.silent = this.parent.silent;
    }
    if (this.parent.debug !== void 0 && this.parent.debug !== null) {
      o.debug = this.parent.debug;
    }
    if (this.parent.assert !== void 0 && this.parent.assert !== null) {
      o.assert = this.parent.assert;
    }
    if (o.debug) {
      logMsg(chalk.cyan('OPTIONS:') + '\n');
      _.each(o, function(val, key) {
        return logMsg(chalk.cyan('  %s') + chalk.cyan.bold(' %s'), PAD(key, 22, null, PAD.RIGHT), val);
      });
      logMsg('');
    }
    EXTEND(true, _opts, o);
  };


  /* Split multiple command-line filenames by the 'TO' keyword */

  splitSrcDest = function() {
    var params, splitAt;
    params = this.parent.args.filter(function(j) {
      return String.is(j);
    });
    if (params.length === 0) {
      throw {
        fluenterror: HMSTATUS.resumeNotFound,
        quit: true
      };
    }
    splitAt = _.findIndex(params, function(p) {
      return p.toLowerCase() === 'to';
    });
    if (splitAt === params.length - 1 && splitAt !== -1) {
      logMsg(chalk.yellow('Please ') + chalk.yellow.bold('specify an output file') + chalk.yellow(' for this operation or ') + chalk.yellow.bold('omit the TO keyword') + chalk.yellow('.'));
      return;
    }
    return {
      src: params.slice(0, splitAt === -1 ? void 0 : splitAt),
      dst: splitAt === -1 ? [] : params.slice(splitAt + 1)
    };
  };


  /* Simple logging placeholder. */

  logMsg = function() {
    return _opts.silent || console.log.apply(console.log, arguments);
  };

}).call(this);

//# sourceMappingURL=main.js.map
