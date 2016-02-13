###*
Definition of the JRSTheme class.
@module core/jrs-theme
@license MIT. See LICENSE.MD for details.
###



_ = require 'underscore'
PATH = require 'path'
parsePath = require 'parse-filepath'
pathExists = require('path-exists').sync



###*
The JRSTheme class is a representation of a JSON Resume theme asset.
@class JRSTheme
###
class JRSTheme



  ###*
  Open and parse the specified theme.
  @method open
  ###
  open: ( thFolder ) ->

    @folder = thFolder

    # Open the [theme-name].json file; should have the same
    # name as folder
    pathInfo = parsePath thFolder

    # Open and parse the theme's package.json file.
    pkgJsonPath = PATH.join thFolder, 'package.json'
    if pathExists pkgJsonPath
      thApi = require thFolder
      thPkg = require pkgJsonPath
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
      throw { fluenterror: HACKMYSTATUS.missingPackageJSON };
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
