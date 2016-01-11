/**
Definition of the `main` function.
@module main.js
@license MIT. See LICENSE.md for details.
*/



(function(){



  var HMR  = require( '../hackmyapi')
    , PKG = require('../../package.json')
    , FS = require('fs')
    , EXTEND = require('../utils/extend')
    , chalk = require('chalk')
    , PATH = require('path')
    , HACKMYSTATUS = require('../core/status-codes')
    , HME = require('../core/event-codes')
    , safeLoadJSON = require('../utils/safe-json-loader')
    , _opts = { }
    , title = chalk.white.bold('\n*** HackMyResume v' + PKG.version + ' ***')
    , StringUtils = require('../utils/string.js')
    , _ = require('underscore')
    , OUTPUT = require('./out')
    , SAFELOAD = require('../utils/safe-json-loader')
    , PAD = require('string-padding')
    , Command = require('commander').Command;



  /**
  Main function for HackMyResume
  @license MIT. See LICENSE.md for details.
  @module main.js
  */
  var main = module.exports = function( rawArgs ) {

    var initInfo = initialize( rawArgs );
    var args = initInfo.args;

    // Create the top-level (application) command...
    var program = new Command('hackmyresume')
      .version(PKG.version)
      .description(chalk.yellow.bold('*** HackMyResume ***'))
      //.option('-o --optionsSafe <optionsFile>', 'Path to a .hackmyrc options file', /^\"(.*)\"$/i )
      .option('-s --silent', 'Run in silent mode')
      .option('--no-color', 'Disable colors')
      .option('--color', 'Enable colors')
      .option('-d --debug', 'Enable diagnostics', false)
      .option('-v --version', 'Show the version')
      .allowUnknownOption();
      program.jsonArgs = initInfo.options;
      //.usage('COMMAND <sources> [TO <targets>]');

    // Create the NEW command
    program
      .command('new')
      .arguments('<sources...>')
      .option('-f --format <fmt>', 'FRESH or JRS format', 'FRESH')
      .alias('create')
      .description('Create resume(s) in FRESH or JSON RESUME format.')
      .action(function( sources ) {
        execute.call( this, sources, [], this.opts(), logMsg);
      });

    // Create the VALIDATE command
    program
      .command('validate')
      .arguments('<sources...>')
      .option('-a --assert', 'Treat validation warnings as errors', false)
      .description('Validate a resume in FRESH or JSON RESUME format.')
      .action(function(sources) {
        execute.call( this, sources, [], this.opts(), logMsg);
      });

    // Create the CONVERT command
    program
      .command('convert')
      //.arguments('<sources...>')
      .description('Convert a resume to/from FRESH or JSON RESUME format.')
      .action(function() {
        var x = splitSrcDest.call( this );
        execute.call( this, x.src, x.dst, this.opts(), logMsg);
      });

    // Create the ANALYZE command
    program
      .command('analyze')
      .arguments('<sources...>')
      .description('Analyze one or more resumes.')
      .action(function( sources ) {
        execute.call( this, sources, [], this.opts(), logMsg);
      });

    // Create the BUILD command
    program
      .command('build')
      .alias('generate')
      //.arguments('<sources> TO [targets]')
      //.usage('...')
      .option('-t --theme <theme>', 'Theme name or path')
      .option('-n --no-prettify', 'Disable HTML prettification', true)
      .option('-c --css <option>', 'CSS linking / embedding', 'embed')
      .option('-p --pdf <engine>', 'PDF generation engine')
      .option('--no-tips', 'Disable theme tips and warnings.', false)
      .description('Generate resume to multiple formats')
      .action(function( sources, targets, options ) {
        var x = splitSrcDest.call( this );
        execute.call( this, x.src, x.dst, this.opts(), logMsg);
      });

    program.parse( args );

    if (!program.args.length) { throw { fluenterror: 4 }; }

  };



  /**
  Massage command-line args and setup Commander.js.
  */
  function initialize( ar ) {

    logMsg( title );

    var o = initOptions( ar );

    // Handle invalid verbs here (a bit easier here than in commander.js)...
    if( o.verb && !HMR.verbs[ o.verb ] && !HMR.alias[ o.verb ] ) {
      throw { fluenterror: HACKMYSTATUS.invalidCommand, shouldExit: true,
              attempted: o.orgVerb };
    }

    // Override the .missingArgument behavior
    Command.prototype.missingArgument = function(name) {
      if( this.name() !== 'new' )
        throw { fluenterror: HACKMYSTATUS.resumeNotFound };
    };

    // Override the .helpInformation behavior
    Command.prototype.helpInformation = function() {
      var manPage = FS.readFileSync(
        PATH.join(__dirname, 'use.txt'), 'utf8' );
      return chalk.green.bold(manPage);
    };

    return {
      args: o.args,
      options: o.json
    };
  }


  function initOptions( ar ) {
    var oVerb, verb = '', args = ar.slice(), cleanArgs = args.slice(2), oJSON;
    if( cleanArgs.length ) {

      // Support case-insensitive sub-commands (build, generate, validate, etc.)..
      var vidx = _.findIndex( cleanArgs, function(v){ return v[0] !== '-'; });
      if( vidx !== -1 ) {
        oVerb = cleanArgs[ vidx ];
        verb = args[ vidx + 2 ] = oVerb.trim().toLowerCase();
      }

      // Remove --options --opts -o and process separately
      var optsIdx = _.findIndex( cleanArgs, function(v){
        return v === '-o' || v === '--options' || v === '--opts';
      });
      if(optsIdx !== -1) {
        optStr = cleanArgs[ optsIdx + 1];
        args.splice( optsIdx + 2, 2 );
        if( optStr && (optStr = optStr.trim()) ) {
          //var myJSON = JSON.parse(optStr);
          if( optStr[0] === '{')
            oJSON = eval('(' + optStr + ')'); // jshint ignore:line
          else
            oJSON = SAFELOAD.loadSafeJson( optStr );
        }
      }
    }

    return {
      orgVerb: oVerb,
      verb: verb,
      json: oJSON,
      args: args
    };
  }


  /**
  Invoke a HackMyResume verb.
  */
  function execute( src, dst, opts, log ) {

    loadOptions.call( this, opts, this.parent.jsonArgs );
    require( '../core/error-handler' ).init( _opts.debug );
    var out = new OUTPUT( _opts );
    var v = new HMR.verbs[ this.name() ]();
    v.on( 'hmr:status', function() { out.do.apply( out, arguments ); });
    v.invoke.call( v, src, dst, _opts, log );

  }



  /**
  Initialize HackMyResume options.
  TODO: Options loading is a little hacky, for two reasons:
    - Commander.js idiosyncracies
    - Need to accept JSON inputs from the command line.
  */
  function loadOptions( o, cmdO ) {

    // o and this.opts() seem to be the same (command-specific options)

    // Load the specified options file (if any) and apply options
    if( cmdO )
      o = EXTEND(true, o, cmdO);

    // Merge in command-line options
    o = EXTEND( true, o, this.opts() );

    // Kludge parent-level options until piping issue is resolved
    if( this.parent.silent !== undefined && this.parent.silent !== null)
      o.silent = this.parent.silent;
    if( this.parent.debug !== undefined && this.parent.debug !== null)
      o.debug = this.parent.debug;

    if( o.debug ) {
      logMsg(chalk.cyan('Merged options: '));
      _.each(o, function(val, key) {
        logMsg(chalk.cyan('%s: %s'), PAD(key,10), val);
      });
    }

    // Cache
    _opts = o;
  }



  /**
  Split multiple command-line filenames by the 'TO' keyword
  */
  function splitSrcDest() {

    var params = this.parent.args.filter(function(j) { return String.is(j); });
    if( params.length === 0 )
      throw { fluenterror: HACKMYSTATUS.resumeNotFound };

    // Find the TO keyword, if any
    var splitAt = _.findIndex( params, function(p) {
      return p.toLowerCase() === 'to';
    });

    // TO can't be the last keyword
    if( splitAt === params.length - 1 && splitAt !== -1 ) {
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
  }



  /**
  Simple logging placeholder.
  */
  function logMsg() {
    _opts.silent || console.log.apply( console.log, arguments );
  }



}());
