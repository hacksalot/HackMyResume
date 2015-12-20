/**
Definition of the Markdown to WordProcessingML conversion routine.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module html-to-wpml.js
*/

(function(){

  var _ = require('underscore');
  var HTML5Tokenizer = require('simple-html-tokenizer');

  module.exports = function( html ) {

    // Tokenize the HTML stream.
    var tokens = HTML5Tokenizer.tokenize( html );

    var final = '', is_bold, is_italic, is_link, link_url;

    // Process <em>, <strong>, and <a> elements in the HTML stream, producing
    // equivalent WordProcessingML that can be dumped into a <w:p> or other
    // text container element.
    _.each( tokens, function( tok ) {

      switch( tok.type ) {

        case 'StartTag':
          switch( tok.tagName ) {
            case 'p': final += '<w:p>'; break;
            case 'strong': is_bold = true; break;
            case 'em': is_italic = true; break;
            case 'a':
              is_link = true;
              link_url = tok.attributes.filter(function(attr){
                return attr[0] === 'href'; }
              )[0][1];
              break;
          }
          break;

        case 'EndTag':
          switch( tok.tagName ) {
            case 'p': final += '</w:p>'; break;
            case 'strong': is_bold = false; break;
            case 'em': is_italic = false; break;
            case 'a': is_link = false; break;
          }
          break;

        case 'Chars':
          var style = is_bold ? '<w:b/>' : '';
          style += is_italic ? '<w:i/>': '';
          style += is_link ? '<w:rStyle w:val="Hyperlink"/>' : '';
          final +=
            (is_link ? ('<w:hlink w:dest="' + link_url + '">') : '') +
            '<w:r><w:rPr>' + style + '</w:rPr><w:t>' + tok.chars +
            '</w:t></w:r>' + (is_link ? '</w:hlink>' : '');
          break;
      }
    });
    return final;

  };

}());
