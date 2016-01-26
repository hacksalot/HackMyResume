###*
Output routines for HackMyResume.
@license MIT. See LICENSE.md for details.
@module cli/out
###



chalk = require('chalk')
HME = require('hackmycore/dist/core/event-codes')
_ = require('underscore')
Class = require('hackmycore/dist/utils/class.js')
M2C = require('hackmycore/dist/utils/md2chalk.js')
PATH = require('path')
LO = require('lodash')
FS = require('fs')
EXTEND = require('extend')
HANDLEBARS = require('handlebars')
YAML = require('yamljs')
printf = require('printf')
pad = require('string-padding')
dbgStyle = 'cyan';


###* A stateful output module. All HMR console output handled here. ###
OutputHandler = module.exports = Class.extend

  init: ( opts ) ->
    @opts = EXTEND( true, this.opts || { }, opts )
    @msgs = YAML.load(PATH.join( __dirname, 'msg.yml' )).events



  log: ( msg ) ->
    msg = msg || ''
    printf = require('printf')
    finished = printf.apply( printf, arguments )
    @opts.silent || console.log( finished )


  do: ( evt ) ->

    that = @
    L = () -> that.log.apply( that, arguments )

    switch evt.sub

      when HME.begin
        this.opts.debug &&
        L( M2C( this.msgs.begin.msg, dbgStyle), evt.cmd.toUpperCase() );

      when HME.beforeCreate
        L( M2C( this.msgs.beforeCreate.msg, 'green' ), evt.fmt, evt.file );
        break;

      when HME.beforeTheme
        this.opts.debug &&
          L( M2C( this.msgs.beforeTheme.msg, dbgStyle), evt.theme.toUpperCase() );

      when HME.afterParse
        L( M2C( this.msgs.afterRead.msg, 'gray', 'white.dim'), evt.fmt.toUpperCase(), evt.file );

      when HME.beforeMerge
        msg = ''
        evt.f.reverse().forEach( ( a, idx ) ->
          msg += printf( (if idx == 0 then @msgs.beforeMerge.msg[0] else @msgs.beforeMerge.msg[1]), a.file )
        , @);
        L( M2C(msg, evt.mixed ? 'yellow' : 'gray', 'white.dim') )

      when HME.applyTheme
        @theme = evt.theme;
        numFormats = Object.keys( evt.theme.formats ).length;
        L( M2C(this.msgs.applyTheme.msg,
          if evt.status == 'error' then 'red' else 'gray',
          if evt.status == 'error' then 'bold' else 'white.dim'),
          evt.theme.name.toUpperCase(),
          numFormats, ( numFormats == 1 ? '' : 's') )

      when HME.end
        if evt.cmd == 'build'
          themeName = this.theme.name.toUpperCase()
          if this.opts.tips && (this.theme.message || this.theme.render)
            WRAP = require('word-wrap')
            if this.theme.message
              L( M2C( this.msgs.afterBuild.msg[0], 'cyan' ), themeName )
              L( M2C( this.theme.message, 'white' ))
            else if this.theme.render
              L( M2C( this.msgs.afterBuild.msg[0], 'cyan'), themeName)
              L( M2C( this.msgs.afterBuild.msg[1], 'white'))

      when HME.afterGenerate
        suffix = ''
        if evt.fmt == 'pdf'
          if this.opts.pdf
            if this.opts.pdf != 'none'
              suffix = printf( M2C( this.msgs.afterGenerate.msg[0], evt.error ? 'red' : 'green' ), this.opts.pdf )
            else
              L( M2C( this.msgs.afterGenerate.msg[1], 'gray' ), evt.fmt.toUpperCase(), evt.file );
              return

        L( M2C( this.msgs.afterGenerate.msg[2] + suffix, evt.error ? 'red' : 'green' ),
            pad(evt.fmt.toUpperCase(),4,null,pad.RIGHT),
            PATH.relative(process.cwd(), evt.file ));

      when HME.beforeAnalyze
        L( M2C( this.msgs.beforeAnalyze.msg, 'green' ), evt.fmt, evt.file)

      when HME.afterAnalyze
        info = evt.info
        rawTpl = FS.readFileSync( PATH.join( __dirname, 'analyze.hbs' ), 'utf8')
        HANDLEBARS.registerHelper( require('hackmycore/dist/helpers/console-helpers') )
        template = HANDLEBARS.compile(rawTpl, { strict: false, assumeObjects: false })
        tot = 0
        info.keywords.forEach (g) -> tot += g.count
        info.keywords.totalKeywords = tot
        output = template( info )
        @log( chalk.cyan(output) )

      when HME.beforeConvert
        L( M2C( this.msgs.beforeConvert.msg, 'green' ),
          evt.srcFile, evt.srcFmt, evt.dstFile, evt.dstFmt
        );

      when HME.afterInlineConvert
        L( M2C( this.msgs.afterInlineConvert.msg, 'gray', 'white.dim' ),
          evt.file, evt.fmt );

      when HME.afterValidate
        style = evt.isValid ? 'green' : 'yellow'
        L(
          M2C( this.msgs.afterValidate.msg[0], 'white' ) +
          chalk[style].bold(
            if evt.isValid
            then this.msgs.afterValidate.msg[1]
            else this.msgs.afterValidate.msg[2] ),
          evt.file, evt.fmt
        );

        if evt.errors
          _.each( evt.errors, (err,idx) ->
            L( chalk.yellow.bold('--> ') + chalk.yellow(err.field.replace('data.','resume.').toUpperCase() + ' ' + err.message))
          , @)

      when HME.afterPeek
        sty = if evt.error then 'red' else ( if evt.target != undefined then 'green' else 'yellow' )
        if evt.requested
          L(M2C(this.msgs.beforePeek.msg[0], sty), evt.requested, evt.file)
        else
          L(M2C(this.msgs.beforePeek.msg[1], sty), evt.file)

        if evt.target != undefined
          console.dir( evt.target, { depth: null, colors: true } )
        else if !evt.error
          L(M2C( this.msgs.afterPeek.msg, 'yellow'), evt.requested, evt.file);
