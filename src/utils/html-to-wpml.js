/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the Markdown to WordProcessingML conversion routine.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module utils/html-to-wpml
*/


const XML = require('xml-escape');
const _ = require('underscore');
const HTML5Tokenizer = require('simple-html-tokenizer');

module.exports = function( html ) {

  // Tokenize the HTML stream.
  let is_bold, is_italic, is_link, link_url;
  const tokens = HTML5Tokenizer.tokenize( html );
  let final = (is_bold = (is_italic = (is_link = (link_url = ''))));

  // Process <em>, <strong>, and <a> elements in the HTML stream, producing
  // equivalent WordProcessingML that can be dumped into a <w:p> or other
  // text container element.
  _.each(tokens, function( tok ) {

    switch (tok.type) {

      case 'StartTag':
        switch (tok.tagName) {
          case 'p': return final += '<w:p>';
          case 'strong': return is_bold = true;
          case 'em': return is_italic = true;
          case 'a':
            is_link = true;
            return link_url = tok.attributes.filter(attr => attr[0] === 'href')[0][1];
        }
        break;

      case 'EndTag':
        switch (tok.tagName) {
          case 'p': return final += '</w:p>';
          case 'strong': return is_bold = false;
          case 'em': return is_italic = false;
          case 'a': return is_link = false;
        }
        break;

      case 'Chars':
        if( tok.chars.trim().length ) {
          let style = is_bold ? '<w:b/>' : '';
          style += is_italic ? '<w:i/>' : '';
          style += is_link ? '<w:rStyle w:val="Hyperlink"/>' : '';
          return final +=
            (is_link ? (`<w:hlink w:dest="${link_url}">`) : '') +
            '<w:r><w:rPr>' + style + '</w:rPr><w:t>' + XML(tok.chars) +
            '</w:t></w:r>' + (is_link ? '</w:hlink>' : '');
        }
        break;
    }
  });
  return final;
};
