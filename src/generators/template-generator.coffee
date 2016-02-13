###*
Definition of the TemplateGenerator class. TODO: Refactor
@module generators/template-generator
@license MIT. See LICENSE.md for details.
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

module.exports = class TemplateGenerator extends BaseGenerator



  ###* Constructor. Set the output format and template format for this
  generator. Will usually be called by a derived generator such as
  HTMLGenerator or MarkdownGenerator. ###

  constructor: ( outputFormat, templateFormat, cssFile ) ->
    super outputFormat
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
      then (@opts = EXTEND( true, { }, _defaultOpts, opts ))
      else @opts

    # Sort such that CSS files are processed before others
    curFmt = opts.themeObj.getFormat( this.format )
    curFmt.files = _.sortBy curFmt.files, (fi) -> fi.ext != 'css'

    # Run the transformation!
    results = curFmt.files.map ( tplInfo, idx ) ->
      if tplInfo.action == 'transform'
        trx = @transform rez, tplInfo.data, @format, opts, opts.themeObj, curFmt
        if tplInfo.ext == 'css'
          curFmt.files[idx].data = trx
        else tplInfo.ext == 'html'
          #tplInfo.css contains the CSS data loaded by theme
          #tplInfo.cssPath contains the absolute path to the source CSS File
      else
        # Images and non-transformable binary files
      opts.onTransform? tplInfo
      return info: tplInfo, data: trx
    , @

    files: results



  ###* Generate a resume using file-based inputs and outputs. Requires access
  to the local filesystem.
  @method generate
  @param rez A FreshResume object.
  @param f Full path to the output resume file to generate.
  @param opts Generator options. ###

  generate: ( rez, f, opts ) ->

    # Prepare
    @opts = EXTEND true, { }, _defaultOpts, opts

    # Call the string-based generation method
    genInfo = @invoke rez, null
    outFolder = parsePath( f ).dirname
    curFmt = opts.themeObj.getFormat @format

    # Process individual files within this format. For example, the HTML
    # output format for a theme may have multiple HTML files, CSS files,
    # etc. Process them here.
    genInfo.files.forEach ( file ) ->

      # console.dir _.omit(file.info,'cssData','data','css' )

      # Pre-processing
      file.info.orgPath = file.info.orgPath || ''
      thisFilePath =
        if file.info.primary
        then f
        else PATH.join outFolder, file.info.orgPath

      if file.info.action != 'copy' and @onBeforeSave
        file.data = this.onBeforeSave
          theme: opts.themeObj
          outputFile: thisFilePath
          mk: file.data
          opts: @opts,
          ext: file.info.ext
        if !file.data
          return

      # Write the file
      opts.beforeWrite? thisFilePath
      MKDIRP.sync PATH.dirname( thisFilePath )

      if file.info.action != 'copy'
        FS.writeFileSync thisFilePath, file.data, encoding: 'utf8', flags: 'w'
      else
        FS.copySync file.info.path, thisFilePath
      opts.afterWrite? thisFilePath

      # Post-processing
      if @onAfterSave
        @onAfterSave outputFile: fileName, mk: file.data, opts: this.opts

    , @

    # Some themes require a symlink structure. If so, create it.
    createSymLinks curFmt, outFolder

    genInfo



  ###* Perform a single resume resume transformation using string-based inputs
  and outputs without touching the local file system.
  @param json A FRESH or JRS resume object.
  @param jst The stringified template data
  @param format The format name, such as "html" or "latex"
  @param cssInfo Needs to be refactored.
  @param opts Options and passthrough data. ###

  transform: ( json, jst, format, opts, theme, curFmt ) ->
    if @opts.freezeBreaks
      jst = freeze jst
    eng = require '../renderers/' + theme.engine  + '-generator'
    result = eng.generate json, jst, format, curFmt, opts, theme
    if this.opts.freezeBreaks
      result = unfreeze result
    result



createSymLinks = ( curFmt, outFolder ) ->
  # Some themes require a symlink structure. If so, create it.
  if curFmt.symLinks
    Object.keys( curFmt.symLinks ).forEach (loc) ->
      absLoc = PATH.join outFolder, loc
      absTarg = PATH.join PATH.dirname(absLoc), curFmt.symLinks[loc]
      # Set type to 'file', 'dir', or 'junction' (Windows only)
      type = if parsePath( absLoc ).extname then 'file' else 'junction'

      try
        FS.symlinkSync absTarg, absLoc, type
      catch
        succeeded = false
        if _error.code == 'EEXIST'
          FS.unlinkSync absLoc
          try
            FS.symlinkSync absTarg, absLoc, type
            succeeded = true
        if !succeeded
          throw ex
    return


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
