###*
Definition of the Markdown to WordProcessingML conversion routine.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module utils/html-to-wpml
###


_ = require 'underscore'
HTML5Tokenizer = require 'simple-html-tokenizer'

module.exports = ( html ) ->

  # Tokenize the HTML stream.
  tokens = HTML5Tokenizer.tokenize( html )
  final = is_bold = is_italic = is_link = link_url = ''

  # Process <em>, <strong>, and <a> elements in the HTML stream, producing
  # equivalent WordProcessingML that can be dumped into a <w:p> or other
  # text container element.
  _.each tokens, ( tok ) ->

    switch tok.type

      when 'StartTag'
        switch tok.tagName
          when 'p' then final += '<w:p>'
          when 'strong' then is_bold = true
          when 'em' then is_italic = true
          when 'a'
            is_link = true;
            link_url = tok.attributes.filter((attr) -> attr[0] == 'href' )[0][1];

      when 'EndTag'
        switch tok.tagName
          when 'p' then final += '</w:p>'
          when 'strong' then is_bold = false
          when 'em' then is_italic = false
          when 'a' then is_link = false

      when 'Chars'
        if( tok.chars.trim().length )
          style = if is_bold then '<w:b/>' else ''
          style += if is_italic then '<w:i/>' else ''
          style += if is_link then '<w:rStyle w:val="Hyperlink"/>' else ''
          final +=
            (if is_link then ('<w:hlink w:dest="' + link_url + '">') else '') +
            '<w:r><w:rPr>' + style + '</w:rPr><w:t>' + tok.chars +
            '</w:t></w:r>' + (if is_link then '</w:hlink>' else '')
  final
