###
Event code definitions.
@module core/default-options
@license MIT. See LICENSE.md for details.
###

module.exports =
  theme: 'modern'
  prettify: # ← See https://github.com/beautify-web/js-beautify#options
    indent_size: 2
    unformatted: ['em','strong']
    max_char: 80, # ← See lib/html.js in above-linked repo
    # wrap_line_length: 120, ← Don't use this
