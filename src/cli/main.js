/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the `main` function.
@module cli/main
@license MIT. See LICENSE.md for details.
*/



const HMR = require('../index');
const PKG = require('../../package.json');
const FS = require('fs');
const EXTEND = require('extend');
const chalk = require('chalk');
const PATH = require('path');
const HMSTATUS = require('../core/status-codes');
const safeLoadJSON = require('../utils/safe-json-loader');
//StringUtils = require '../utils/string.js'
const _ = require('underscore');
const OUTPUT = require('./out');
const PAD = require('string-padding');
const { Command } = require('commander');
const M2C = require('../utils/md2chalk');
const printf = require('printf');
const _opts = { };
const _title = chalk.white.bold(`\n*** HackMyResume v${PKG.version} ***`);
const _out = new OUTPUT( _opts );
const _err = require('./error');
let _exitCallback = null;



/*
A callable implementation of the HackMyResume CLI. Encapsulates the command
line interface as a single method accepting a parameter array.
@alias module:cli/main.main
@param rawArgs {Array} An array of command-line parameters. Will either be
process.argv (in production) or custom parameters (in test).
*/
module.exports = function( rawArgs, exitCallback ) {

  const initInfo = initialize( rawArgs, exitCallback );
  if (initInfo === null) {
    return;
  }

  const { args } = initInfo;

  // Create the top-level (application) command...
  const program = new Command('hackmyresume')
    .version(PKG.version)
    .description(chalk.yellow.bold('*** HackMyResume ***'))
    .option('-s --silent', 'Run in silent mode')
    .option('--no-color', 'Disable colors')
    .option('--color', 'Enable colors')
    .option('-d --debug', 'Enable diagnostics', false)
    .option('-a --assert', 'Treat warnings as errors', false)
    .option('-v --version', 'Show the version')
    .allowUnknownOption();
  program.jsonArgs = initInfo.options;

  // Create the NEW command
  program
    .command('new')
    .arguments('<sources...>')
    .option('-f --format <fmt>', 'FRESH or JRS format', 'FRESH')
    .alias('create')
    .description('Create resume(s) in FRESH or JSON RESUME format.')
    .action((function( sources ) {
      execute.call( this, sources, [], this.opts(), logMsg);
    })
  );

  // Create the VALIDATE command
  program
    .command('validate')
    .arguments('<sources...>')
    .description('Validate a resume in FRESH or JSON RESUME format.')
    .action(function(sources) {
      execute.call( this, sources, [], this.opts(), logMsg);
    });

  // Create the CONVERT command
  program
    .command('convert')
    .description('Convert a resume to/from FRESH or JSON RESUME format.')
    .option('-f --format <fmt>', 'FRESH or JRS format and optional version', undefined)
    .action(function() {
      const x = splitSrcDest.call( this );
      execute.call( this, x.src, x.dst, this.opts(), logMsg);
    });

  // Create the ANALYZE command
  program
    .command('analyze')
    .arguments('<sources...>')
    .option('--private', 'Include resume fields marked as private', false)
    .description('Analyze one or more resumes.')
    .action(function( sources ) {
      execute.call( this, sources, [], this.opts(), logMsg);
    });

  // Create the PEEK command
  program
    .command('peek')
    .arguments('<sources...>')
    .description('Peek at a resume field or section')
    //.action(( sources, sectionOrField ) ->
    .action(function( sources ) {
      const dst = (sources && (sources.length > 1)) ? [sources.pop()] : [];
      execute.call( this, sources, dst, this.opts(), logMsg);
    });

  // Create the BUILD command
  program
    .command('build')
    .alias('generate')
    .option('-t --theme <theme>', 'Theme name or path')
    .option('-n --no-prettify', 'Disable HTML prettification', true)
    .option('-c --css <option>', 'CSS linking / embedding')
    .option('-p --pdf <engine>', 'PDF generation engine')
    .option('--no-sort', 'Sort resume sections by date', false)
    .option('--tips', 'Display theme tips and warnings.', false)
    .option('--private', 'Include resume fields marked as private', false)
    .option('--no-escape', 'Turn off encoding in Handlebars themes.', false)
    .description('Generate resume to multiple formats')
    //.action(( sources, targets, options ) ->
    .action(function() {
      const x = splitSrcDest.call( this );
      execute.call( this, x.src, x.dst, this.opts(), logMsg);
    });

  // Create the HELP command
  program
    .command('help')
    .arguments('[command]')
    .description('Get help on a HackMyResume command')
    .action(function( cmd ) {
      cmd = cmd || 'use';
      const manPage = FS.readFileSync(
        PATH.join(__dirname, `help/${cmd}.txt`),
        'utf8');
      _out.log(M2C(manPage, 'white', 'yellow.bold'));
  });

  program.parse( args );

  if (!program.args.length) {
    throw {fluenterror: 4};
  }
};



/* Massage command-line args and setup Commander.js. */
var initialize = function( ar, exitCallback ) {

  _exitCallback = exitCallback || process.exit;
  const o = initOptions(ar);
  if (o.ex) {
    _err.init(false, true, false);
    if( o.ex.op === 'parse' ) {
      _err.err({
        fluenterror: o.ex.op === 'parse' ? HMSTATUS.invalidOptionsFile : HMSTATUS.optionsFileNotFound,
        inner: o.ex.inner,
        quit: true
      });
    } else {
      _err.err({fluenterror: HMSTATUS.optionsFileNotFound, inner: o.ex.inner, quit: true});
    }
    return null;
  }
  o.silent || logMsg( _title );

  // Emit debug prelude if --debug was specified
  if (o.debug) {
    _out.log(chalk.cyan('The -d or --debug switch was specified. DEBUG mode engaged.'));
    _out.log('');
    _out.log(chalk.cyan(PAD('  Platform:',25, null, PAD.RIGHT)) + chalk.cyan.bold( process.platform === 'win32' ? 'windows' : process.platform ));
    _out.log(chalk.cyan(PAD('  Node.js:',25, null, PAD.RIGHT)) + chalk.cyan.bold( process.version ));
    _out.log(chalk.cyan(PAD('  HackMyResume:',25, null, PAD.RIGHT)) + chalk.cyan.bold(`v${PKG.version}` ));
    _out.log(chalk.cyan(PAD('  FRESCA:',25, null, PAD.RIGHT)) + chalk.cyan.bold( PKG.dependencies.fresca ));
    //_out.log(chalk.cyan(PAD('  fresh-themes:',25, null, PAD.RIGHT)) + chalk.cyan.bold( PKG.dependencies['fresh-themes'] ))
    //_out.log(chalk.cyan(PAD('  fresh-jrs-converter:',25, null, PAD.RIGHT)) + chalk.cyan.bold( PKG.dependencies['fresh-jrs-converter'] ))
    _out.log('');
  }

  _err.init(o.debug, o.assert, o.silent);

  // Handle invalid verbs here (a bit easier here than in commander.js)...
  if (o.verb && !HMR.verbs[ o.verb ] && !HMR.alias[ o.verb ] && (o.verb !== 'help')) {
    _err.err({fluenterror: HMSTATUS.invalidCommand, quit: true, attempted: o.orgVerb}, true);
  }

  // Override the .missingArgument behavior
  Command.prototype.missingArgument = function() {
    if (this.name() !== 'help') {
      _err.err({
        verb: this.name(),
        fluenterror: HMSTATUS.resumeNotFound
      }
        , true);
    }
  };

  // Override the .helpInformation behavior
  Command.prototype.helpInformation = function() {
    const manPage = FS.readFileSync(
      PATH.join(__dirname, 'help/use.txt'), 'utf8' );
    return M2C(manPage, 'white', 'yellow');
  };

  return {
    args: o.args,
    options: o.json
  };
};



/* Init options prior to setting up command infrastructure. */
var initOptions = function( ar ) {

  let oJSON, oVerb;
  oVerb;
  let verb = '';
  const args = ar.slice();
  const cleanArgs = args.slice( 2 );
  oJSON;

  if (cleanArgs.length) {

    // Support case-insensitive sub-commands (build, generate, validate, etc)
    const vidx = _.findIndex(cleanArgs, v => v[0] !== '-');
    if (vidx !== -1) {
      oVerb = cleanArgs[ vidx ];
      verb = (args[ vidx + 2 ] = oVerb.trim().toLowerCase());
    }

    // Remove --options --opts -o and process separately
    const optsIdx = _.findIndex(cleanArgs, v => (v === '-o') || (v === '--options') || (v === '--opts'));

    if (optsIdx !== -1) {
      let optStr = cleanArgs[ optsIdx + 1];
      args.splice( optsIdx + 2, 2 );
      if (optStr && (optStr = optStr.trim())) {
        //var myJSON = JSON.parse(optStr);
        if( optStr[0] === '{') {
          // TODO: remove use of evil(). - hacksalot
          /* jshint ignore:start */
          oJSON = eval(`(${optStr})`); // jshint ignore:line <-- no worky
          /* jshint ignore:end */
        } else {
          const inf = safeLoadJSON( optStr );
          if( !inf.ex ) {
            oJSON = inf.json;
          } else {
            return inf;
          }
        }
      }
    }
  }

  // Grab the --debug flag, --silent, --assert and --no-color flags
  const isDebug = _.some(args, v => (v === '-d') || (v === '--debug'));
  const isSilent = _.some(args, v => (v === '-s') || (v === '--silent'));
  const isAssert = _.some(args, v => (v === '-a') || (v === '--assert'));
  const isMono = _.some(args, v => v === '--no-color');
  const isNoEscape = _.some(args, v => v === '--no-escape');

  return {
    color: !isMono,
    debug: isDebug,
    silent: isSilent,
    assert: isAssert,
    noescape: isNoEscape,
    orgVerb: oVerb,
    verb,
    json: oJSON,
    args
  };
};



/* Invoke a HackMyResume verb. */
var execute = function( src, dst, opts, log ) {

  // Create the verb
  const v = new (HMR.verbs[ this.name() ])();

  // Initialize command-specific options
  loadOptions.call(this, opts, this.parent.jsonArgs);

  // Set up error/output handling
  _opts.errHandler = v;
  _out.init(_opts);

  // Hook up event notifications
  v.on('hmr:status', function() { return _out.do.apply(_out, arguments); });
  v.on('hmr:error', function() {  return _err.err.apply(_err, arguments); });

  // Invoke the verb using promise syntax
  const prom = v.invoke.call(v, src, dst, _opts, log);
  prom.then(executeSuccess, executeFail);
};



/* Success handler for verb invocations. Calls process.exit by default */
var executeSuccess = function() {};
  // Can't call _exitCallback here (process.exit) when PDF is running in BK
  //_exitCallback 0; return



/* Failure handler for verb invocations. Calls process.exit by default */
var executeFail = function(err) {
  //console.dir err
  let finalErrorCode = -1;
  if (err) {
    if (err.fluenterror) {
      finalErrorCode = err.fluenterror;
    } else if (err.length) {
      finalErrorCode = err[0].fluenterror;
    } else {
      finalErrorCode = err;
    }
  }
  if (_opts.debug) {
    const msgs = require('./msg').errors;
    logMsg(printf(M2C( msgs.exiting.msg, 'cyan' ), finalErrorCode));
    if (err.stack) { logMsg(err.stack); }
  }
  _exitCallback(finalErrorCode);
};



/*
Initialize HackMyResume options.
TODO: Options loading is a little hacky, for two reasons:
  - Commander.js idiosyncracies
  - Need to accept JSON inputs from the command line.
*/
var loadOptions = function( o, cmdO ) {

  // o and this.opts() seem to be the same (command-specific options)

  // Load the specified options file (if any) and apply options
  if( cmdO ) {
    o = EXTEND(true, o, cmdO);
  }

  // Merge in command-line options
  o = EXTEND( true, o, this.opts() );

  // Kludge parent-level options until piping issue is resolved
  if ((this.parent.silent !== undefined) && (this.parent.silent !== null)) {
    o.silent = this.parent.silent;
  }
  if ((this.parent.debug !== undefined) && (this.parent.debug !== null)) {
    o.debug = this.parent.debug;
  }
  if ((this.parent.assert !== undefined) && (this.parent.assert !== null)) {
    o.assert = this.parent.assert;
  }

  if (o.debug) {
    logMsg(chalk.cyan('OPTIONS:') + '\n');
    _.each(o, (val, key) =>
      logMsg(chalk.cyan('  %s') + chalk.cyan.bold(' %s'),
        PAD(key,22,null,PAD.RIGHT), val)
    );
    logMsg('');
  }

  // Cache
  EXTEND( true, _opts, o );
};

/* Split multiple command-line filenames by the 'TO' keyword */
var splitSrcDest = function() {

  const params = this.parent.args.filter(j => String.is(j));
  if (params.length === 0) {
    //tmpName = @name()
    throw { fluenterror: HMSTATUS.resumeNotFound, verb: this.name(), quit: true };
  }

  // Find the TO keyword, if any
  const splitAt = _.findIndex( params, p => p.toLowerCase() === 'to');

  // TO can't be the last keyword
  if ((splitAt === (params.length - 1)) && (splitAt !== -1)) {
    logMsg(chalk.yellow('Please ') +
      chalk.yellow.bold('specify an output file') +
      chalk.yellow(' for this operation or ') +
      chalk.yellow.bold('omit the TO keyword') +
      chalk.yellow('.') );
    return;
  }

  return {
    src: params.slice(0, splitAt === -1 ? undefined : splitAt ),
    dst: splitAt === -1 ? [] : params.slice( splitAt + 1 )
  };
};



/* Simple logging placeholder. */
var logMsg = function() {
  // eslint-disable-next-line no-console
  return _opts.silent || console.log.apply( console.log, arguments );
};
