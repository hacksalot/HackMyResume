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



### A representation of a FRESH theme asset.
@class FRESHTheme ###
class FRESHTheme



  ### Open and parse the specified theme. ###
  open: ( themeFolder ) ->

    @folder = themeFolder

    # Open the [theme-name].json file; should have the same name as folder
    pathInfo = parsePath themeFolder

    # Set up a formats hash for the theme
    formatsHash = { }

    # Load the theme
    themeFile = PATH.join themeFolder, 'theme.json'
    themeInfo = loadSafeJson themeFile
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



### Load and parse theme source files. ###
_load = (formatsHash) ->

  that = @
  major = false
  tplFolder = PATH.join @folder, 'src'

  copyOnly = ['.ttf','.otf', '.png','.jpg','.jpeg','.pdf']

  # Iterate over all files in the theme folder, producing an array, fmts,
  # containing info for each file. While we're doing that, also build up
  # the formatsHash object.
  fmts = READFILES(tplFolder).map (absPath) ->
    _loadOne.call @, absPath, formatsHash, tplFolder
  , @

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



### Load a single theme file. ###
_loadOne = ( absPath, formatsHash, tplFolder ) ->

  pathInfo = parsePath absPath
  absPathSafe = absPath.trim().toLowerCase()
  outFmt = ''
  act = 'copy'
  isPrimary = false

  # If this is an "explicit" theme, all files of importance are specified in
  # the "transform" section of the theme.json file.
  if @explicit

    outFmt = _.find Object.keys( @formats ), ( fmtKey ) ->
      fmtVal = @formats[ fmtKey ]
      _.some fmtVal.transform, (fpath) ->
        absPathB = PATH.join( @folder, fpath ).trim().toLowerCase()
        absPathB == absPathSafe
      , @
    , @
    act = 'transform' if outFmt

  if !outFmt
    # If this file lives in a specific format folder within the theme,
    # such as "/latex" or "/html", then that format is the implicit output
    # format for all files within the folder
    portion = pathInfo.dirname.replace tplFolder,''
    if portion && portion.trim()
      return if portion[1] == '_'
      reg = /^(?:\/|\\)(html|latex|doc|pdf|png|partials)(?:\/|\\)?/ig
      res = reg.exec( portion )
      if res
        if res[1] != 'partials'
          outFmt = res[1]
          act = 'transform' if !@explicit
        else
          @partials = @partials || []
          @partials.push( { name: pathInfo.name, path: absPath } )
          return null

  # Otherwise, the output format is inferred from the filename, as in
  # compact-[outputformat].[extension], for ex, compact-pdf.html
  if !outFmt
    idx = pathInfo.name.lastIndexOf '-'
    outFmt = if idx == -1 then pathInfo.name else pathInfo.name.substr idx+1
    act = 'transform' if !@explicit
    defFormats = require './default-formats'
    isPrimary = _.some defFormats, (form) ->
      form.name == outFmt and pathInfo.extname != '.css'

  # Make sure we have a valid formatsHash
  formatsHash[ outFmt ] = formatsHash[outFmt] || {
    outFormat: outFmt,
    files: []
  }

  # Move symlink descriptions from theme.json to the format
  if @formats?[ outFmt ]?.symLinks
    formatsHash[ outFmt ].symLinks = @formats[ outFmt ].symLinks

  # Create the file representation object
  obj =
    action: act
    primary: isPrimary
    path: absPath
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



### Return a more friendly name for certain formats. ###
friendlyName = ( val ) ->
  val = (val && val.trim().toLowerCase()) || ''
  friendly = { yml: 'yaml', md: 'markdown', txt: 'text' }
  friendly[val] || val



module.exports = FRESHTheme
