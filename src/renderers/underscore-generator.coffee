###*
Definition of the UnderscoreGenerator class.
@license MIT. See LICENSE.md for details.
@module underscore-generator.js
###



_ = require 'underscore'
registerHelpers = require '../helpers/underscore-helpers'
require '../utils/string'
escapeLaTeX = require 'escape-latex'

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

    # Massage resume strings / text
    r = null
    switch format
      when 'html' then r = json.markdownify()
      when 'pdf' then r = json.markdownify()
      when 'png' then r = json.markdownify()
      when 'latex'
        traverse = require 'traverse'
        r = traverse(json).map (x) ->
          if @isLeaf && String.is @node
            return escapeLaTeX @node
          @node
      else r = json

    # Set up the context
    ctx =
      r: r
      filt: opts.filters
      XML: require 'xml-escape'
      RAW: json
      cssInfo: cssInfo
      #engine: @
      headFragment: opts.headFragment || ''
      opts: opts

    # Link to our helpers
    registerHelpers theme, opts, cssInfo, ctx, @

    # Generate!
    @generateSimple ctx, jst
