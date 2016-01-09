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
    , Command = require('commander').Command;



  /**
  Main function for HackMyResume
  @license MIT. See LICENSE.md for details.
  @module main.js
  */
  var main = module.exports = function( args ) {

    args = initialize( args );

    // Create the top-level (application) command...
    var program = new Command('hackmyresume')
      .version(PKG.version)
      .description(chalk.yellow.bold('*** HackMyResume ***'))
      .option('-o --opts <optionsFile>', 'Path to a .hackmyrc options file')
      .option('-s --silent', 'Run in silent mode')
      .option('--no-color', 'Disable colors')
      .option('--color', 'Enable colors')
      .option('-d --debug', 'Enable diagnostics', false);
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

    // Support case-insensitive sub-commands (build, generate, validate, etc.)..
    var oVerb, verb = '', args = ar.slice(), cleanArgs = args.slice(2);
    if( cleanArgs.length ) {
      var verbIdx = _.findIndex( cleanArgs, function(v){ return v[0] !== '-'; });
      if( verbIdx !== -1 ) {
        oVerb = cleanArgs[ verbIdx ];
        verb = args[ verbIdx + 2 ] = oVerb.trim().toLowerCase();
      }
    }

    // Handle invalid verbs here (a bit easier here than in commander.js)...
    if( verb && !HMR.verbs[ verb ] && !HMR.alias[ verb ] ) {
      throw { fluenterror: HACKMYSTATUS.invalidCommand, shouldExit: true,
              attempted: oVerb };
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

    return args;
  }



  /**
  Invoke a HackMyResume verb.
  */
  function execute( src, dst, opts, log ) {

    loadOptions.call( this, opts );
    require( '../core/error-handler' ).init( _opts.debug );
    var out = new OUTPUT( _opts );
    var v = new HMR.verbs[ this.name() ]();
    v.on( 'hmr:status', function() { out.do.apply( out, arguments ); });
    v.invoke.call( v, src, dst, _opts, log );

  }



  /**
  Initialize HackMyResume options.
  */
  function loadOptions( o ) {
    o.opts = this.parent.opts;
    // Load the specified options file (if any) and apply options
    if( o.opts && String.is( o.opts )) {
      var json = safeLoadJSON( PATH.relative( process.cwd(), o.opts ) );
      json && ( o = EXTEND( true, o, json ) );
      if( !json ) {
        throw safeLoadJSON.error;
      }
    }
    // Merge in command-line options
    o = EXTEND( true, o, this.opts() );
    o.silent = this.parent.silent;
    o.debug = this.parent.debug;
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
  function logMsg( msg ) {
    msg = msg || '';
    _opts.silent || console.log( msg );
  }



}());
