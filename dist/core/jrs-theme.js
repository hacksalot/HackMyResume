
/**
Definition of the JRSTheme class.
@module core/jrs-theme
@license MIT. See LICENSE.MD for details.
 */

(function() {
  var JRSTheme, PATH, _, parsePath, pathExists;

  _ = require('underscore');

  PATH = require('path');

  parsePath = require('parse-filepath');

  pathExists = require('path-exists').sync;


  /**
  The JRSTheme class is a representation of a JSON Resume theme asset.
  @class JRSTheme
   */

  JRSTheme = (function() {
    function JRSTheme() {}


    /**
    Open and parse the specified theme.
    @method open
     */

    JRSTheme.prototype.open = function(thFolder) {
      var pathInfo, pkgJsonPath, thApi, thPkg;
      this.folder = thFolder;
      pathInfo = parsePath(thFolder);
      pkgJsonPath = PATH.join(thFolder, 'package.json');
      if (pathExists(pkgJsonPath)) {
        thApi = require(thFolder);
        thPkg = require(pkgJsonPath);
        this.name = thPkg.name;
        this.render = (thApi && thApi.render) || void 0;
        this.engine = 'jrs';
        this.formats = {
          html: {
            outFormat: 'html',
            files: [
              {
                action: 'transform',
                render: this.render,
                primary: true,
                ext: 'html',
                css: null
              }
            ]
          },
          pdf: {
            outFormat: 'pdf',
            files: [
              {
                action: 'transform',
                render: this.render,
                primary: true,
                ext: 'pdf',
                css: null
              }
            ]
          }
        };
      } else {
        throw {
          fluenterror: HACKMYSTATUS.missingPackageJSON
        };
      }
      return this;
    };


    /**
    Determine if the theme supports the output format.
    @method hasFormat
     */

    JRSTheme.prototype.hasFormat = function(fmt) {
      return _.has(this.formats, fmt);
    };


    /**
    Return the requested output format.
    @method getFormat
     */

    JRSTheme.prototype.getFormat = function(fmt) {
      return this.formats[fmt];
    };

    return JRSTheme;

  })();

  module.exports = JRSTheme;

}).call(this);

//# sourceMappingURL=jrs-theme.js.map
