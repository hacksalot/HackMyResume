
/**
Definition of the Markdown to WordProcessingML conversion routine.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module utils/html-to-wpml
 */

(function() {
  var HTML5Tokenizer, _;

  _ = require('underscore');

  HTML5Tokenizer = require('simple-html-tokenizer');

  module.exports = function(html) {
    var final, is_bold, is_italic, is_link, link_url, tokens;
    tokens = HTML5Tokenizer.tokenize(html);
    final = is_bold = is_italic = is_link = link_url = '';
    _.each(tokens, function(tok) {
      var style;
      switch (tok.type) {
        case 'StartTag':
          switch (tok.tagName) {
            case 'p':
              return final += '<w:p>';
            case 'strong':
              return is_bold = true;
            case 'em':
              return is_italic = true;
            case 'a':
              is_link = true;
              return link_url = tok.attributes.filter(function(attr) {
                return attr[0] === 'href';
              })[0][1];
          }
          break;
        case 'EndTag':
          switch (tok.tagName) {
            case 'p':
              return final += '</w:p>';
            case 'strong':
              return is_bold = false;
            case 'em':
              return is_italic = false;
            case 'a':
              return is_link = false;
          }
          break;
        case 'Chars':
          if ((tok.chars.trim().length)) {
            style = is_bold ? '<w:b/>' : '';
            style += is_italic ? '<w:i/>' : '';
            style += is_link ? '<w:rStyle w:val="Hyperlink"/>' : '';
            return final += (is_link ? '<w:hlink w:dest="' + link_url + '">' : '') + '<w:r><w:rPr>' + style + '</w:rPr><w:t>' + tok.chars + '</w:t></w:r>' + (is_link ? '</w:hlink>' : '');
          }
      }
    });
    return final;
  };

}).call(this);

//# sourceMappingURL=html-to-wpml.js.map
