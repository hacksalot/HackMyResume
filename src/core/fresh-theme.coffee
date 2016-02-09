###*
Definition of the FRESHTheme class.
@module core/fresh-theme
@license MIT. See LICENSE.md for details.
###



FS = require 'fs'
validator = require 'is-my-json-valid'
_ = require 'underscore'
PATH = require 'path'
parsePath = require 'parse-filepath'
pathExists = require('path-exists').sync
EXTEND = require 'extend'
HMSTATUS = require './status-codes'
moment = require 'moment'
loadSafeJson = require '../utils/safe-json-loader'
READFILES = require 'recursive-readdir-sync'



###
The FRESHTheme class is a representation of a FRESH theme
asset. See also: JRSTheme.
@class FRESHTheme
###
class FRESHTheme




  ###
  Open and parse the specified theme.
  ###
  open: ( themeFolder ) ->

    this.folder = themeFolder;

    # Open the [theme-name].json file; should have the same name as folder
    pathInfo = parsePath( themeFolder )

    # Set up a formats hash for the theme
    formatsHash = { }

    # Load the theme
    themeFile = PATH.join( themeFolder, 'theme.json' )
    themeInfo = loadSafeJson( themeFile )
    if themeInfo.ex
      throw
        fluenterror:
          if themeInfo.ex.operation == 'parse'
          then HMSTATUS.parseError
          else HMSTATUS.readError
      inner: themeInfo.ex.inner

    that = this

    # Move properties from the theme JSON file to the theme object
    EXTEND true, @, themeInfo.json

    # Check for an "inherits" entry in the theme JSON.
    if @inherits
      cached = { }
      _.each @inherits, (th, key) ->
        themesFolder = require.resolve 'fresh-themes'
        d = parsePath( themeFolder ).dirname
        themePath = PATH.join d, th
        cached[ th ] = cached[th] || new FRESHTheme().open( themePath )
        formatsHash[ key ] = cached[ th ].getFormat( key )

    # Load theme files
    formatsHash = _load.call @, formatsHash

    # Cache
    @formats = formatsHash

    # Set the official theme name
    @name = parsePath( @folder ).name
    @

  ### Determine if the theme supports the specified output format. ###
  hasFormat: ( fmt ) -> _.has @formats, fmt

  ### Determine if the theme supports the specified output format. ###
  getFormat: ( fmt ) -> @formats[ fmt ]



### Load the theme implicitly, by scanning the theme folder for files. TODO:
Refactor duplicated code with loadExplicit. ###
_load = (formatsHash) ->

  # Set up a hash of formats supported by this theme.
  that = @
  major = false

  # Establish the base theme folder
  tplFolder = PATH.join @folder, 'src'

  copyOnly = ['.ttf','.otf', '.png','.jpg','.jpeg','.pdf']

  # Iterate over all files in the theme folder, producing an array, fmts,
  # containing info for each file. While we're doing that, also build up
  # the formatsHash object.
  fmts = READFILES(tplFolder).map (absPath) ->

    pathInfo = parsePath absPath
    absPathSafe = absPath.trim().toLowerCase()
    outFmt = ''
    isMajor = false

    # If this file is mentioned in the theme's JSON file under "transforms"
    if that.formats
      outFmt = _.find Object.keys( that.formats ), ( fmtKey ) ->
          fmtVal = that.formats[ fmtKey ]
          _.some fmtVal.transform, (fpath) ->
            absPathB = PATH.join( that.folder, fpath ).trim().toLowerCase()
            absPathB == absPathSafe
      isMajor = true if outFmt

    if !outFmt
      # If this file lives in a specific format folder within the theme,
      # such as "/latex" or "/html", then that format is the output format
      # for all files within the folder.
      portion = pathInfo.dirname.replace tplFolder,''
      if portion && portion.trim()
        return if portion[1] == '_'
        reg = /^(?:\/|\\)(html|latex|doc|pdf|png|partials)(?:\/|\\)?/ig
        res = reg.exec( portion )
        if res
          if res[1] != 'partials'
            outFmt = res[1]
          else
            that.partials = that.partials || []
            that.partials.push( { name: pathInfo.name, path: absPath } )
            return null

    # Otherwise, the output format is inferred from the filename, as in
    # compact-[outputformat].[extension], for ex, compact-pdf.html.
    if !outFmt
      idx = pathInfo.name.lastIndexOf '-'
      outFmt = if idx == -1 then pathInfo.name else pathInfo.name.substr( idx + 1 )
      isMajor = true

    act = if _.contains copyOnly, pathInfo.extname then 'copy' else 'transform'

    # We should have a valid output format now.
    formatsHash[ outFmt ] = formatsHash[outFmt] || {
      outFormat: outFmt,
      files: []
    }
    if that.formats?[ outFmt ]?.symLinks
      formatsHash[ outFmt ].symLinks = that.formats[ outFmt ].symLinks

    # Create the file representation object.
    obj =
      action: act
      path: absPath
      major: isMajor
      orgPath: PATH.relative tplFolder, absPath
      ext: pathInfo.extname.slice 1
      title: friendlyName outFmt
      pre: outFmt
      # outFormat: outFmt || pathInfo.name,
      data: FS.readFileSync absPath, 'utf8'
      css: null

    # Add this file to the list of files for this format type.
    formatsHash[ outFmt ].files.push( obj )
    obj

  # Now, get all the CSS files...
  @cssFiles = fmts.filter (fmt) -> fmt and (fmt.ext == 'css')

  # For each CSS file, get its corresponding HTML file. It's possible that
  # a theme can have a CSS file but *no* HTML file, as when a theme author
  # creates a pure CSS override of an existing theme.
  @cssFiles.forEach (cssf) ->
    idx = _.findIndex fmts, ( fmt ) ->
      fmt && fmt.pre == cssf.pre && fmt.ext == 'html'
    cssf.major = false
    if idx > -1
      fmts[ idx ].css = cssf.data
      fmts[ idx ].cssPath = cssf.path
    else
      if that.inherits
        # Found a CSS file without an HTML file in a theme that inherits
        # from another theme. This is the override CSS file.
        that.overrides = { file: cssf.path, data: cssf.data }
  formatsHash



# ###
# Load the theme explicitly, by following the 'formats' hash
# in the theme's JSON settings file.
# ###
# loadExplicit = (formatsHash) ->
#
#   # Housekeeping
#   tplFolder = PATH.join this.folder, 'src'
#   act = null
#   that = this
#
#   # Iterate over all files in the theme folder, producing an array, fmts,
#   # containing info for each file. While we're doing that, also build up
#   # the formatsHash object.
#   fmts = READFILES( tplFolder ).map (absPath) ->
#
#     act = null
#
#     pathInfo = parsePath absPath
#     absPathSafe = absPath.trim().toLowerCase()
#
#     # If this file is mentioned in the theme's JSON file under "transforms"
#     outFmt = _.find Object.keys( that.formats ), ( fmtKey ) ->
#         fmtVal = that.formats[ fmtKey ]
#         _.some fmtVal.transform, (fpath) ->
#           absPathB = PATH.join( that.folder, fpath ).trim().toLowerCase()
#           absPathB == absPathSafe
#
#     act = 'transform' if outFmt
#
#     # If this file lives in a specific format folder within the theme,
#     # such as "/latex" or "/html", then that format is the output format
#     # for all files within the folder.
#     if !outFmt
#       portion = pathInfo.dirname.replace tplFolder,''
#       if portion && portion.trim()
#         reg = /^(?:\/|\\)(html|latex|doc|pdf)(?:\/|\\)?/ig
#         res = reg.exec portion
#         res && (outFmt = res[1])
#
#     # Otherwise, the output format is inferred from the filename, as in
#     # compact-[outputformat].[extension], for ex, compact-pdf.html.
#     if !outFmt
#       idx = pathInfo.name.lastIndexOf '-'
#       outFmt = if (idx == -1) then pathInfo.name else pathInfo.name.substr(idx + 1)
#
#     # We should have a valid output format now.
#     formatsHash[ outFmt ] =
#       formatsHash[ outFmt ] || {
#         outFormat: outFmt,
#         files: [],
#         symLinks: that.formats[ outFmt ].symLinks
#       };
#
#     # Create the file representation object.
#     obj =
#       action: act
#       orgPath: PATH.relative(that.folder, absPath)
#       path: absPath
#       ext: pathInfo.extname.slice(1)
#       title: friendlyName( outFmt )
#       pre: outFmt
#       # outFormat: outFmt || pathInfo.name,
#       data: FS.readFileSync( absPath, 'utf8' )
#       css: null
#
#     # Add this file to the list of files for this format type.
#     formatsHash[ outFmt ].files.push( obj )
#     obj
#
#   # Now, get all the CSS files...
#   @cssFiles = fmts.filter ( fmt ) -> fmt.ext == 'css'
#
#   # For each CSS file, get its corresponding HTML file
#   @cssFiles.forEach ( cssf ) ->
#     # For each CSS file, get its corresponding HTML file
#     idx = _.findIndex fmts, ( fmt ) ->
#       fmt.pre == cssf.pre && fmt.ext == 'html'
#     fmts[ idx ].css = cssf.data
#     fmts[ idx ].cssPath = cssf.path
#
#   # Remove CSS files from the formats array
#   fmts = fmts.filter ( fmt) -> fmt.ext != 'css'
#   formatsHash



###
Return a more friendly name for certain formats.
TODO: Refactor
###
friendlyName = ( val ) ->
  val = val.trim().toLowerCase()
  friendly = { yml: 'yaml', md: 'markdown', txt: 'text' }
  friendly[val] || val


module.exports = FRESHTheme
