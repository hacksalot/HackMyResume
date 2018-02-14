###*
Definition of the JRSTheme class.
@module core/jrs-theme
@license MIT. See LICENSE.MD for details.
###



_ = require 'underscore'
PATH = require 'path'
parsePath = require 'parse-filepath'
pathExists = require('path-exists').sync
errors = require './status-codes'



###*
The JRSTheme class is a representation of a JSON Resume theme asset.
@class JRSTheme
###
class JRSTheme



  ###*
  Open and parse the specified JRS theme.
  @method open
  ###
  open: ( thFolder ) ->

    @folder = thFolder
    pathInfo = parsePath thFolder

    # Open and parse the theme's package.json file
    pkgJsonPath = PATH.join thFolder, 'package.json'
    if pathExists pkgJsonPath
      thApi = require thFolder     # Requiring the folder yields whatever the package.json's "main" is set to
      thPkg = require pkgJsonPath  # Get the package.json as JSON
      this.name = thPkg.name
      this.render = (thApi && thApi.render) || undefined
      this.engine = 'jrs'

      # Create theme formats (HTML and PDF). Just add the bare minimum mix of
      # properties necessary to allow JSON Resume themes to share a rendering
      # path with FRESH themes.
      this.formats =
        html:
          outFormat: 'html'
          files: [{
            action: 'transform',
            render: this.render,
            primary: true,
            ext: 'html',
            css: null
          }]
        pdf:
          outFormat: 'pdf'
          files: [{
            action: 'transform',
            render: this.render,
            primary: true,
            ext: 'pdf',
            css: null
          }]
    else
      throw fluenterror: errors.missingPackageJSON
    @



  ###*
  Determine if the theme supports the output format.
  @method hasFormat
  ###
  hasFormat: ( fmt ) ->  _.has this.formats, fmt



  ###*
  Return the requested output format.
  @method getFormat
  ###
  getFormat: ( fmt ) -> @formats[ fmt ]


module.exports = JRSTheme;
