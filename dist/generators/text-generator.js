
/**
Definition of the TextGenerator class.
@module generators/text-generator
@license MIT. See LICENSE.md for details.
 */

(function() {
  var TemplateGenerator, TextGenerator,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  TemplateGenerator = require('./template-generator');


  /**
  The TextGenerator generates a plain-text resume via the TemplateGenerator.
   */

  module.exports = TextGenerator = (function(superClass) {
    extend(TextGenerator, superClass);

    function TextGenerator() {
      TextGenerator.__super__.constructor.call(this, 'txt');
    }

    return TextGenerator;

  })(TemplateGenerator);

}).call(this);

//# sourceMappingURL=text-generator.js.map
