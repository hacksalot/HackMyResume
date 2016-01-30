###*
Definition of the TemplateGenerator class. TODO: Refactor
@license MIT. See LICENSE.md for details.
@module template-generator.js
###



FS = require 'fs-extra'
_ = require 'underscore'
MD = require 'marked'
XML = require 'xml-escape'
PATH = require 'path'
parsePath = require 'parse-filepath'
MKDIRP = require 'mkdirp'
BaseGenerator = require './base-generator'
EXTEND = require 'extend'
FRESHTheme = require '../core/fresh-theme'
JRSTheme = require '../core/jrs-theme'



###*
TemplateGenerator performs resume generation via local Handlebar or Underscore
style template expansion and is appropriate for text-based formats like HTML,
plain text, and XML versions of Microsoft Word, Excel, and OpenOffice.
@class TemplateGenerator
###

TemplateGenerator = module.exports = BaseGenerator.extend

  ###* Constructor. Set the output format and template format for this
  generator. Will usually be called by a derived generator such as
  HTMLGenerator or MarkdownGenerator. ###

  init: ( outputFormat, templateFormat, cssFile ) ->
    @_super outputFormat
    @tplFormat = templateFormat || outputFormat
    return



  ###* Generate a resume using string-based inputs and outputs without touching
  the filesystem.
  @method invoke
  @param rez A FreshResume object.
  @param opts Generator options.
  @returns {Array} An array of objects representing the generated output
  files. ###

  invoke: ( rez, opts ) ->

    opts =
      if opts
      then (this.opts = EXTEND( true, { }, _defaultOpts, opts ))
      else this.opts

    # Sort such that CSS files are processed before others
    curFmt = opts.themeObj.getFormat( this.format )
    curFmt.files = _.sortBy curFmt.files, (fi) -> fi.ext != 'css'

    # Run the transformation!
    results = curFmt.files.map( ( tplInfo, idx ) ->
      trx = @.single rez, tplInfo.data, this.format, opts, opts.themeObj, curFmt
      if tplInfo.ext == 'css'
        curFmt.files[idx].data = trx
      else tplInfo.ext == 'html'
        #tplInfo.css contains the CSS data loaded by theme
        #tplInfo.cssPath contains the absolute path to the source CSS File
      return info: tplInfo, data: trx
    , @)

    files: results


  ###* Generate a resume using file-based inputs and outputs. Requires access
  to the local filesystem.
  @method generate
  @param rez A FreshResume object.
  @param f Full path to the output resume file to generate.
  @param opts Generator options. ###

  generate: ( rez, f, opts ) ->

    # Prepare
    this.opts = EXTEND( true, { }, _defaultOpts, opts );

    # Call the string-based generation method to perform the generation.
    genInfo = this.invoke( rez, null )
    outFolder = parsePath( f ).dirname
    curFmt = opts.themeObj.getFormat( this.format )

    # Process individual files within this format. For example, the HTML
    # output format for a theme may have multiple HTML files, CSS files,
    # etc. Process them here.
    genInfo.files.forEach(( file ) ->

      # Pre-processing
      file.info.orgPath = file.info.orgPath || '' # <-- For JRS themes
      thisFilePath = PATH.join( outFolder, file.info.orgPath )
      if this.onBeforeSave
        file.data = this.onBeforeSave
          theme: opts.themeObj
          outputFile: if file.info.major then f else thisFilePath
          mk: file.data
          opts: this.opts
        if !file.data
          return # PDF etc

      # Write the file
      fileName = if file.info.major then f else thisFilePath
      MKDIRP.sync PATH.dirname( fileName )
      FS.writeFileSync fileName, file.data, { encoding: 'utf8', flags: 'w' }

      # Post-processing
      if @onAfterSave
        @onAfterSave( outputFile: fileName, mk: file.data, opts: this.opts )

    , @)

    # Some themes require a symlink structure. If so, create it.
    if curFmt.symLinks
      Object.keys( curFmt.symLinks ).forEach (loc) ->
        absLoc = PATH.join outFolder, loc
        absTarg = PATH.join PATH.dirname(absLoc), curFmt.symLinks[loc]
        # 'file', 'dir', or 'junction' (Windows only)
        type = parsePath( absLoc ).extname ? 'file' : 'junction'
        FS.symlinkSync absTarg, absLoc, type

    genInfo


  ###* Perform a single resume resume transformation using string-based inputs
  and outputs without touching the local file system.
  @param json A FRESH or JRS resume object.
  @param jst The stringified template data
  @param format The format name, such as "html" or "latex"
  @param cssInfo Needs to be refactored.
  @param opts Options and passthrough data. ###

  single: ( json, jst, format, opts, theme, curFmt ) ->
    if this.opts.freezeBreaks
      jst = freeze jst
    eng = require '../renderers/' + theme.engine  + '-generator'
    result = eng.generate json, jst, format, curFmt, opts, theme
    if this.opts.freezeBreaks
      result = unfreeze result
    result



###* Export the TemplateGenerator function/ctor. ###
module.exports = TemplateGenerator



###* Freeze newlines for protection against errant JST parsers. ###
freeze = ( markup ) ->
  markup.replace( _reg.regN, _defaultOpts.nSym )
  markup.replace( _reg.regR, _defaultOpts.rSym )



###* Unfreeze newlines when the coast is clear. ###
unfreeze = ( markup ) ->
  markup.replace _reg.regSymR, '\r'
  markup.replace _reg.regSymN, '\n'


###* Default template generator options. ###
_defaultOpts =
  engine: 'underscore'
  keepBreaks: true
  freezeBreaks: false
  nSym: '&newl;' # newline entity
  rSym: '&retn;' # return entity
  template:
    interpolate: /\{\{(.+?)\}\}/g
    escape: /\{\{\=(.+?)\}\}/g
    evaluate: /\{\%(.+?)\%\}/g
    comment: /\{\#(.+?)\#\}/g
  filters:
    out: ( txt ) -> txt
    raw: ( txt ) -> txt
    xml: ( txt ) -> XML(txt)
    md: ( txt ) -> MD( txt || '' )
    mdin: ( txt ) -> MD(txt || '' ).replace(/^\s*<p>|<\/p>\s*$/gi, '')
    lower: ( txt ) -> txt.toLowerCase()
    link: ( name, url ) ->
      return if url then '<a href="' + url + '">' + name + '</a>' else name
  prettify: # ← See https://github.com/beautify-web/js-beautify#options
    indent_size: 2
    unformatted: ['em','strong','a']
    max_char: 80 # ← See lib/html.js in above-linked repo
    #wrap_line_length: 120, <-- Don't use this



###* Regexes for linebreak preservation. ###
_reg =
  regN: new RegExp( '\n', 'g' )
  regR: new RegExp( '\r', 'g' )
  regSymN: new RegExp( _defaultOpts.nSym, 'g' )
  regSymR: new RegExp( _defaultOpts.rSym, 'g' )
