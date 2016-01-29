###*
Definition of the HTMLGenerator class.
@license MIT. See LICENSE.md for details.
@module html-generator.js
###



TemplateGenerator = require './template-generator'
FS = require 'fs-extra'
HTML = require 'html'
PATH = require 'path'
require 'string.prototype.endswith'



HtmlGenerator = module.exports = TemplateGenerator.extend

  init: -> @_super 'html'

  ###*
  Copy satellite CSS files to the destination and optionally pretty-print
  the HTML resume prior to saving.
  ###
  onBeforeSave: ( info ) ->
    if info.outputFile.endsWith '.css'
      return info.mk
    if @opts.prettify
    then HTML.prettyPrint info.mk, this.opts.prettify
    else info.mk
