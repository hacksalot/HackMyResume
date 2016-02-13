###*
Error-handling routines for HackMyResume.
@module cli/error
@license MIT. See LICENSE.md for details.
###



HMSTATUS = require '../core/status-codes'
PKG = require '../../package.json'
FS = require 'fs'
FCMD = require '../index'
PATH = require 'path'
WRAP = require 'word-wrap'
M2C = require '../utils/md2chalk'
chalk = require 'chalk'
extend = require 'extend'
YAML = require 'yamljs'
printf = require 'printf'
SyntaxErrorEx = require '../utils/syntax-error-ex'
require 'string.prototype.startswith'



###* Error handler for HackMyResume. All errors are handled here.
@class ErrorHandler ###
ErrorHandler = module.exports =

  init: ( debug, assert, silent ) ->
    @debug = debug
    @assert = assert
    @silent = silent
    @msgs = require('./msg').errors
    @

  err: ( ex, shouldExit ) ->

    # Short-circuit logging output if --silent is on
    o = if @silent then () -> else _defaultLog

    # Special case; can probably be removed.
    throw ex if ex.pass

    # Load error messages
    @msgs = @msgs || require('./msg').errors

    # Handle packaged HMR exceptions
    if ex.fluenterror

      # Output the error message
      objError = assembleError.call @, ex
      o( @[ 'format_' + objError.etype ]( objError.msg ))

      # Output the stack (sometimes)
      if objError.withStack
        stack = ex.stack || (ex.inner && ex.inner.stack);
        stack && o( chalk.gray( stack ) );

      # Quit if necessary
      if shouldExit
        if @debug
          o chalk.cyan('Exiting with error code ' + ex.fluenterror.toString())
        if @assert
          ex.pass = true
          throw ex
        process.exit ex.fluenterror

    # Handle raw exceptions
    else
      o ex
      stackTrace = ex.stack || (ex.inner && ex.inner.stack)
      if stackTrace && this.debug
        o M2C(ex.stack || ex.inner.stack, 'gray')



  format_error: ( msg ) ->
    msg = msg || ''
    chalk.red.bold( if msg.toUpperCase().startsWith('ERROR:') then msg else 'Error: ' + msg )


  format_warning: ( brief, msg ) ->
    chalk.yellow(brief) + chalk.yellow(msg || '')


  format_custom: ( msg ) -> msg



_defaultLog = () -> console.log.apply console.log, arguments




assembleError = ( ex ) ->

  msg = ''
  withStack = false
  quit = false
  etype = 'warning'
  withStack = true if @debug

  switch ex.fluenterror

    when HMSTATUS.themeNotFound
      msg = printf( M2C( this.msgs.themeNotFound.msg, 'yellow' ), ex.data)

    when HMSTATUS.copyCSS
      msg = M2C( this.msgs.copyCSS.msg, 'red' )
      quit = false

    when HMSTATUS.resumeNotFound
      msg = M2C( this.msgs.resumeNotFound.msg, 'yellow' );

    when HMSTATUS.missingCommand
      msg = M2C( this.msgs.missingCommand.msg + " (", 'yellow');
      msg += Object.keys( FCMD.verbs ).map( (v, idx, ar) ->
        return ( if idx == ar.length - 1 then chalk.yellow('or ') else '') +
          chalk.yellow.bold(v.toUpperCase());
      ).join( chalk.yellow(', ')) + chalk.yellow(").\n\n");

      msg += chalk.gray(FS.readFileSync(
        PATH.resolve(__dirname, '../cli/use.txt'), 'utf8' ))

    when HMSTATUS.invalidCommand
      msg = printf( M2C( this.msgs.invalidCommand.msg, 'yellow'), ex.attempted )

    when HMSTATUS.resumeNotFoundAlt
      msg = M2C( this.msgs.resumeNotFoundAlt.msg, 'yellow' )

    when HMSTATUS.inputOutputParity
      msg = M2C( this.msgs.inputOutputParity.msg )

    when HMSTATUS.createNameMissing
      msg = M2C( this.msgs.createNameMissing.msg )

    when HMSTATUS.pdfGeneration
      msg = M2C( this.msgs.pdfGeneration.msg, 'bold' )
      msg += chalk.red('\n' + ex.inner) if ex.inner
      quit = false
      etype = 'error'

    when HMSTATUS.invalid
      msg = M2C( this.msgs.invalid.msg, 'red' )
      etype = 'error'

    when HMSTATUS.generateError
      msg = (ex.inner && ex.inner.toString()) || ex
      quit = false
      etype = 'error'

    when HMSTATUS.fileSaveError
      msg = printf( M2C( this.msgs.fileSaveError.msg ), (ex.inner || ex).toString() )
      etype = 'error'
      quit = false

    when HMSTATUS.invalidFormat
      ex.data.forEach( (d) ->
        msg += printf( M2C( this.msgs.invalidFormat.msg, 'bold' ),
          ex.theme.name.toUpperCase(), d.format.toUpperCase())
      , @);

    when HMSTATUS.missingParam
      msg = printf(M2C( this.msgs.missingParam.msg ), ex.expected, ex.helper)

    when HMSTATUS.invalidHelperUse
      msg = printf( M2C( this.msgs.invalidHelperUse.msg ), ex.helper )
      if ex.error
        msg += '\n--> ' + assembleError.call( this, extend( true, {}, ex, {fluenterror: ex.error} )).msg;
        #msg += printf( '\n--> ' + M2C( this.msgs.invalidParamCount.msg ), ex.expected );
      quit = false
      etype = 'warning'

    when HMSTATUS.notOnPath
      msg = printf( M2C(this.msgs.notOnPath.msg, 'bold'), ex.engine)
      quit = false
      etype = 'error'

    when HMSTATUS.readError
      if !ex.quiet
        console.error(printf( M2C(this.msgs.readError.msg, 'red'), ex.file))
      msg = ex.inner.toString()
      etype = 'error'

    when HMSTATUS.mixedMerge
      msg = M2C this.msgs.mixedMerge.msg
      quit = false

    when HMSTATUS.invokeTemplate
      msg = M2C this.msgs.invokeTemplate.msg, 'red'
      msg += M2C( '\n' + WRAP(ex.inner.toString(), { width: 60, indent: '   ' }), 'gray' );
      etype = 'custom'

    when HMSTATUS.compileTemplate
      etype = 'error'

    when HMSTATUS.themeLoad
      msg = M2C( printf( this.msgs.themeLoad.msg, ex.attempted.toUpperCase() ), 'red');
      if ex.inner && ex.inner.fluenterror
        msg += M2C('\nError: ', 'red') + assembleError.call( this, ex.inner ).msg
      quit = true
      etype = 'custom'

    when HMSTATUS.parseError
      if SyntaxErrorEx.is ex.inner
        console.error printf( M2C(this.msgs.readError.msg, 'red'), ex.file )
        se = new SyntaxErrorEx ex, ex.raw
        if se.line? and se.col?
          msg = printf M2C( this.msgs.parseError.msg[0], 'red' ), se.line, se.col
        else if se.line?
          msg = printf M2C( this.msgs.parseError.msg[1], 'red' ), se.line
        else
          msg = M2C @msgs.parseError.msg[2], 'red'
      else if ex.inner && ex.inner.line? && ex.inner.col?
        msg = printf( M2C( this.msgs.parseError.msg[0], 'red' ), ex.inner.line, ex.inner.col)
      else
        msg = ex
      etype = 'error'

    when HMSTATUS.createError
      # inner.code could be EPERM, EACCES, etc
      msg = printf M2C( this.msgs.createError.msg ), ex.inner.path
      etype = 'error'

    when HMSTATUS.validateError
      msg = printf M2C( @msgs.validateError.msg ), ex.inner.toString()
      etype = 'error'

  msg: msg              # The error message to display
  withStack: withStack  # Whether to include the stack
  quit: quit
  etype: etype
