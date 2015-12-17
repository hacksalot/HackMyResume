
(function(){

  var _ = require('underscore');
  var HTML5Tokenizer = require('simple-html-tokenizer');

  module.exports = function( html ) {

    var final = '';
    var is_bold = false, is_italic = false;
    var depth = 0;

    var tokens = HTML5Tokenizer.tokenize( html );
    _.each( tokens, function( tok ) {
      switch( tok.type ) {
        case 'StartTag':
          switch( tok.tagName ) {
            case 'p':
              final += '<w:p>';
              break;
            case 'strong':
              is_bold = true;
              break;
            case 'em':
              is_italic = true;
              break;
            case 'a':
              is_link = true;
              break;
          }
          break;
        case 'EndTag':
          switch( tok.tagName ) {
            case 'p':
              final += '</w:p>';
              break;
            case 'strong':
              is_bold = false;
              break;
            case 'em':
              is_italic = false;
              break;
            case 'a':
              is_link = false;
              break;
          }
          break;
        case 'Chars':
          var style = is_bold ? '<w:b/>' : '';
          style += is_italic ? '<w:i/>': '';
          final += '<w:r><w:rPr>' + style + '</w:rPr><w:t>' + tok.chars + '</w:t></w:r>';
          break;
      }
    });
    return final;

  };

}());
