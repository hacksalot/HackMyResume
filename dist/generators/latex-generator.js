
/**
Definition of the LaTeXGenerator class.
@module generators/latex-generator
@license MIT. See LICENSE.md for details.
 */

(function() {
  var LaTeXGenerator, TemplateGenerator,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  TemplateGenerator = require('./template-generator');


  /**
  LaTeXGenerator generates a LaTeX resume via TemplateGenerator.
   */

  module.exports = LaTeXGenerator = (function(superClass) {
    extend(LaTeXGenerator, superClass);

    function LaTeXGenerator() {
      LaTeXGenerator.__super__.constructor.call(this, 'latex', 'tex');
    }

    return LaTeXGenerator;

  })(TemplateGenerator);

}).call(this);

//# sourceMappingURL=latex-generator.js.map
