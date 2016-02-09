###*
Definition of the UnderscoreGenerator class.
@license MIT. See LICENSE.md for details.
@module underscore-generator.js
###



_ = require 'underscore'
registerHelpers = require '../helpers/underscore-helpers'



###*
Perform template-based resume generation using Underscore.js.
@class UnderscoreGenerator
###
UnderscoreGenerator = module.exports =



  generateSimple: ( data, tpl ) ->
    try
      # Compile and run the Handlebars template.
      t = _.template tpl
      t data
    catch
      #console.dir _error
      HMS = require '../core/status-codes'
      throw
        fluenterror: HMS[if t then 'invokeTemplate' else 'compileTemplate']
        inner: _error



  generate: ( json, jst, format, cssInfo, opts, theme ) ->

    # Tweak underscore's default template delimeters
    delims = (opts.themeObj && opts.themeObj.delimeters) || opts.template;
    if opts.themeObj && opts.themeObj.delimeters
      delims = _.mapObject delims, (val,key) -> new RegExp val, "ig"
    _.templateSettings = delims;

    # Strip {# comments #}
    jst = jst.replace delims.comment, ''

    ctx =
      r: if format == 'html' || format == 'pdf' || format == 'png' then json.markdownify() else json
      filt: opts.filters
      XML: require 'xml-escape'
      RAW: json
      cssInfo: cssInfo
      #engine: @
      headFragment: opts.headFragment || ''
      opts: opts

    registerHelpers theme, opts, cssInfo, ctx, @
    @generateSimple ctx, jst
