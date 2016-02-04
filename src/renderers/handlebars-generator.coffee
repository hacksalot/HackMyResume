###*
Definition of the HandlebarsGenerator class.
@license MIT. See LICENSE.md for details.
@module renderers/handlebars-generator
###


_ = require 'underscore'
HANDLEBARS = require 'handlebars'
FS = require 'fs'
registerHelpers = require '../helpers/handlebars-helpers'
PATH = require 'path'
parsePath = require 'parse-filepath'
READFILES = require 'recursive-readdir-sync'
HMSTATUS = require '../core/status-codes'
SLASH = require 'slash'



###*
Perform template-based resume generation using Handlebars.js.
@class HandlebarsGenerator
###
HandlebarsGenerator = module.exports =



  generateSimple: ( data, tpl ) ->

    try
      # Compile and run the Handlebars template.
      template = HANDLEBARS.compile tpl, {strict: false, assumeObjects: false}
      return template data
    catch
      throw
        fluenterror:
          HMSTATUS[ if template then 'invokeTemplate' else 'compileTemplate' ]
        inner: _error



  generate: ( json, jst, format, curFmt, opts, theme ) ->

    # Set up partials and helpers
    registerPartials format, theme
    registerHelpers theme, opts

    # Preprocess text
    encData = json
    if format == 'html' || format == 'pdf'
      encData = json.markdownify()
    if( format == 'doc' )
      encData = json.xmlify()

    # Set up the context
    ctx =
      r: encData
      RAW: json
      filt: opts.filters
      format: format
      opts: opts
      engine: @
      results: curFmt.files
      headFragment: opts.headFragment || ''

    # Render the template
    return this.generateSimple ctx, jst



registerPartials = (format, theme) ->

  if _.contains( ['html','doc','md','txt','pdf'], format )

    # Locate the global partials folder
    partialsFolder = PATH.join(
      parsePath( require.resolve('fresh-themes') ).dirname,
      '/partials/',
      if format == 'pdf' then 'html' else format
    )

    # Register global partials in the /partials/[format] folder
    # TODO: Only do this once per HMR invocation.
    _.each READFILES( partialsFolder, (error)->{ }), ( el ) ->
      pathInfo = parsePath el
      name = SLASH PATH.relative( partialsFolder, el ).replace(/\.(?:html|xml|hbs|md|txt)$/i, '')
      tplData = FS.readFileSync el, 'utf8'
      compiledTemplate = HANDLEBARS.compile tplData
      HANDLEBARS.registerPartial name, compiledTemplate
      theme.partialsInitialized = true

  # Register theme-specific partials
  _.each theme.partials, ( el ) ->
    tplData = FS.readFileSync el.path, 'utf8'
    compiledTemplate = HANDLEBARS.compile tplData
    HANDLEBARS.registerPartial el.name, compiledTemplate
