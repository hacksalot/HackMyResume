###*
Definition of the `main` function.
@module cli/main
@license MIT. See LICENSE.md for details.
###



HMR = require '../index'
PKG = require '../../package.json'
FS = require 'fs'
EXTEND = require 'extend'
chalk = require 'chalk'
PATH = require 'path'
HMSTATUS = require '../core/status-codes'
HME = require '../core/event-codes'
safeLoadJSON = require '../utils/safe-json-loader'
StringUtils = require '../utils/string.js'
_ = require 'underscore'
OUTPUT = require './out'
PAD = require 'string-padding'
Command = require('commander').Command
M2C = require '../utils/md2chalk'
printf = require 'printf'
_opts = { }
_title = chalk.white.bold('\n*** HackMyResume v' +PKG.version+ ' ***')
_out = new OUTPUT( _opts )
_err = require('./error')
_exitCallback = null



###
A callable implementation of the HackMyResume CLI. Encapsulates the command
line interface as a single method accepting a parameter array.
@alias module:cli/main.main
@param rawArgs {Array} An array of command-line parameters. Will either be
process.argv (in production) or custom parameters (in test).
###
main = module.exports = ( rawArgs, exitCallback ) ->

  initInfo = initialize( rawArgs, exitCallback )
  args = initInfo.args

  # Create the top-level (application) command...
  program = new Command('hackmyresume')
    .version(PKG.version)
    .description(chalk.yellow.bold('*** HackMyResume ***'))
    .option('-s --silent', 'Run in silent mode')
    .option('--no-color', 'Disable colors')
    .option('--color', 'Enable colors')
    .option('-d --debug', 'Enable diagnostics', false)
    .option('-a --assert', 'Treat warnings as errors', false)
    .option('-v --version', 'Show the version')
    .allowUnknownOption();
    program.jsonArgs = initInfo.options

  # Create the NEW command
  program
    .command 'new'
    .arguments '<sources...>'
    .option '-f --format <fmt>', 'FRESH or JRS format', 'FRESH'
    .alias 'create'
    .description 'Create resume(s) in FRESH or JSON RESUME format.'
    .action (( sources ) ->
      execute.call( this, sources, [], this.opts(), logMsg)
      return
    )

  # Create the VALIDATE command
  program
    .command('validate')
    .arguments('<sources...>')
    .description('Validate a resume in FRESH or JSON RESUME format.')
    .action((sources) ->
      execute.call( this, sources, [], this.opts(), logMsg)
      return
    )

  # Create the CONVERT command
  program
    .command('convert')
    .description('Convert a resume to/from FRESH or JSON RESUME format.')
    .action(->
      x = splitSrcDest.call( this );
      execute.call( this, x.src, x.dst, this.opts(), logMsg)
      return
    )

  # Create the ANALYZE command
  program
    .command('analyze')
    .arguments('<sources...>')
    .description('Analyze one or more resumes.')
    .action(( sources ) ->
      execute.call( this, sources, [], this.opts(), logMsg)
      return
    )

  # Create the PEEK command
  program
    .command('peek')
    .arguments('<sources...>')
    .description('Peek at a resume field or section')
    .action(( sources, sectionOrField ) ->
      dst = if (sources && sources.length > 1) then [sources.pop()] else []
      execute.call( this, sources, dst, this.opts(), logMsg)
      return
    )

  # Create the BUILD command
  program
    .command('build')
    .alias('generate')
    .option('-t --theme <theme>', 'Theme name or path')
    .option('-n --no-prettify', 'Disable HTML prettification', true)
    .option('-c --css <option>', 'CSS linking / embedding')
    .option('-p --pdf <engine>', 'PDF generation engine')
    .option('--no-sort', 'Sort resume sections by date', false)
    .option('--tips', 'Display theme tips and warnings.', false)
    .description('Generate resume to multiple formats')
    .action(( sources, targets, options ) ->
      x = splitSrcDest.call( this );
      execute.call( this, x.src, x.dst, this.opts(), logMsg)
      return
    )

  program.parse( args )

  if !program.args.length
    throw fluenterror: 4



### Massage command-line args and setup Commander.js. ###
initialize = ( ar, exitCallback ) ->

  _exitCallback = exitCallback || process.exit
  o = initOptions ar
  o.silent || logMsg( _title )

  # Emit debug prelude if --debug was specified
  if o.debug
    _out.log(chalk.cyan('The -d or --debug switch was specified. DEBUG mode engaged.'))
    _out.log('')
    _out.log(chalk.cyan(PAD('  Platform:',25, null, PAD.RIGHT)) + chalk.cyan.bold( if process.platform == 'win32' then 'windows' else process.platform ))
    _out.log(chalk.cyan(PAD('  Node.js:',25, null, PAD.RIGHT)) + chalk.cyan.bold( process.version ))
    _out.log(chalk.cyan(PAD('  HackMyResume:',25, null, PAD.RIGHT)) + chalk.cyan.bold('v' + PKG.version ))
    _out.log(chalk.cyan(PAD('  FRESCA:',25, null, PAD.RIGHT)) + chalk.cyan.bold( PKG.dependencies.fresca ))
    #_out.log(chalk.cyan(PAD('  fresh-themes:',25, null, PAD.RIGHT)) + chalk.cyan.bold( PKG.dependencies['fresh-themes'] ))
    #_out.log(chalk.cyan(PAD('  fresh-jrs-converter:',25, null, PAD.RIGHT)) + chalk.cyan.bold( PKG.dependencies['fresh-jrs-converter'] ))
    _out.log('')

  _err.init o.debug, o.assert, o.silent

  # Handle invalid verbs here (a bit easier here than in commander.js)...
  if o.verb && !HMR.verbs[ o.verb ] && !HMR.alias[ o.verb ]
    _err.err fluenterror: HMSTATUS.invalidCommand, quit: true, attempted: o.orgVerb, true

  # Override the .missingArgument behavior
  Command.prototype.missingArgument = (name) ->
    _err.err
      fluenterror:
        if this.name() != 'new'
        then HMSTATUS.resumeNotFound
        else HMSTATUS.createNameMissing
      , true
    return


  # Override the .helpInformation behavior
  Command.prototype.helpInformation = ->
    manPage = FS.readFileSync(
      PATH.join(__dirname, 'use.txt'), 'utf8' )
    return chalk.green.bold(manPage)

  return {
    args: o.args,
    options: o.json
  }



### Init options prior to setting up command infrastructure. ###
initOptions = ( ar ) ->

  oVerb
  verb = ''
  args = ar.slice()
  cleanArgs = args.slice( 2 )
  oJSON

  if cleanArgs.length

    # Support case-insensitive sub-commands (build, generate, validate, etc)
    vidx = _.findIndex cleanArgs, (v) -> v[0] != '-'
    if vidx != -1
      oVerb = cleanArgs[ vidx ]
      verb = args[ vidx + 2 ] = oVerb.trim().toLowerCase()

    # Remove --options --opts -o and process separately
    optsIdx = _.findIndex cleanArgs, (v) ->
      v == '-o' || v == '--options' || v == '--opts'

    if optsIdx != -1
      optStr = cleanArgs[ optsIdx + 1]
      args.splice( optsIdx + 2, 2 )
      if optStr && (optStr = optStr.trim())
        #var myJSON = JSON.parse(optStr);
        if( optStr[0] == '{')
          ### jshint ignore:start ###
          oJSON = eval('(' + optStr + ')') # jshint ignore:line <-- no worky
          ### jshint ignore:end ###
        else
          inf = safeLoadJSON( optStr )
          if( !inf.ex )
            oJSON = inf.json
          # TODO: Error handling

  # Grab the --debug flag, --silent, --assert and --no-color flags
  isDebug = _.some args, (v) -> v == '-d' || v == '--debug'
  isSilent = _.some args, (v) -> v == '-s' || v == '--silent'
  isAssert = _.some args, (v) -> v == '-a' || v == '--assert'
  isMono = _.some args, (v) -> v == '--no-color'

  return {
    color: !isMono,
    debug: isDebug,
    silent: isSilent,
    assert: isAssert,
    orgVerb: oVerb,
    verb: verb,
    json: oJSON,
    args: args
  }



### Invoke a HackMyResume verb. ###
execute = ( src, dst, opts, log ) ->

  # Create the verb
  v = new HMR.verbs[ @name() ]()

  # Initialize command-specific options
  loadOptions.call( this, opts, this.parent.jsonArgs )

  # Set up error/output handling
  _opts.errHandler = v
  _out.init _opts

  # Hook up event notifications
  v.on 'hmr:status', -> _out.do.apply _out, arguments
  v.on 'hmr:error', ->  _err.err.apply _err, arguments

  # Invoke the verb using promise syntax
  prom = v.invoke.call v, src, dst, _opts, log
  prom.then executeSuccess, executeFail
  return



### Success handler for verb invocations. Calls process.exit by default ###
executeSuccess = (obj) ->
  # Can't call _exitCallback here (process.exit) when PDF is running in BK
  #_exitCallback 0; return



### Failure handler for verb invocations. Calls process.exit by default ###
executeFail = (err) ->
  finalErrorCode = -1
  if err
    finalErrorCode = if err.fluenterror then err.fluenterror else err
  if _opts.debug
    msgs = require('./msg').errors;
    logMsg printf M2C( msgs.exiting.msg, 'cyan' ), finalErrorCode
    logMsg err.stack if err.stack
  _exitCallback finalErrorCode
  return



###
Initialize HackMyResume options.
TODO: Options loading is a little hacky, for two reasons:
  - Commander.js idiosyncracies
  - Need to accept JSON inputs from the command line.
###
loadOptions = ( o, cmdO ) ->

  # o and this.opts() seem to be the same (command-specific options)

  # Load the specified options file (if any) and apply options
  if( cmdO )
    o = EXTEND(true, o, cmdO)

  # Merge in command-line options
  o = EXTEND( true, o, this.opts() )

  # Kludge parent-level options until piping issue is resolved
  if this.parent.silent != undefined && this.parent.silent != null
    o.silent = this.parent.silent
  if this.parent.debug != undefined && this.parent.debug != null
    o.debug = this.parent.debug
  if this.parent.assert != undefined && this.parent.assert != null
    o.assert = this.parent.assert

  if o.debug
    logMsg(chalk.cyan('OPTIONS:') + '\n')
    _.each(o, (val, key) ->
      logMsg(chalk.cyan('  %s') + chalk.cyan.bold(' %s'),
        PAD(key,22,null,PAD.RIGHT), val)
    );
    logMsg('');

  # Cache
  EXTEND( true, _opts, o )
  return

### Split multiple command-line filenames by the 'TO' keyword ###
splitSrcDest = () ->

  params = this.parent.args.filter((j) -> return String.is(j) )
  if params.length == 0
    throw { fluenterror: HMSTATUS.resumeNotFound, quit: true }

  # Find the TO keyword, if any
  splitAt = _.findIndex( params, (p) -> return p.toLowerCase() == 'to'; )

  # TO can't be the last keyword
  if splitAt == params.length - 1 && splitAt != -1
    logMsg(chalk.yellow('Please ') +
      chalk.yellow.bold('specify an output file') +
      chalk.yellow(' for this operation or ') +
      chalk.yellow.bold('omit the TO keyword') +
      chalk.yellow('.') )
    return

  return {
    src: params.slice(0, if splitAt == -1 then undefined else splitAt ),
    dst: if splitAt == -1 then [] else params.slice( splitAt + 1 )
  }



### Simple logging placeholder. ###
logMsg = () ->
  _opts.silent || console.log.apply( console.log, arguments )
