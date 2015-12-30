/**
Definition of the JRSTheme class.
@module jrs-theme.js
@license MIT. See LICENSE.MD for details.
*/

(function() {



  var _ = require('underscore')
    , PATH = require('path')
    , parsePath = require('parse-filepath')
    , pathExists = require('path-exists').sync;



  /**
  The JRSTheme class is a representation of a JSON Resume theme asset.
  @class JRSTheme
  */
  function JRSTheme() {

  }

  /**
  Open and parse the specified theme.
  */
  JRSTheme.prototype.open = function( themeFolder ) {

    this.folder = themeFolder;

    // Open the [theme-name].json file; should have the same name as folder
    var pathInfo = parsePath( themeFolder );

    // Open and parse the theme's package.json file.
    var packageJsonPath = PATH.join(themeFolder, 'package.json');
    if( pathExists( packageJsonPath ) ) {
      var themePack = require( themeFolder );
      var themePkgJson = require( packageJsonPath );
      this.name = themePkgJson.name;
      this.render = (themePack && themePack.render) || undefined;
      this.formats = {
        html: { title: 'html', outFormat: 'html', ext: 'html' }
      };
    }
    else {
      throw { fluenterror: 10 };
    }

    return this;
  };

  /**
  Determine if the theme supports the specified output format.
  */
  JRSTheme.prototype.hasFormat = function( fmt ) {
    return _.has( this.formats, fmt );
  };

  /**
  Determine if the theme supports the specified output format.
  */
  JRSTheme.prototype.getFormat = function( fmt ) {
    return this.formats[ fmt ];
  };

  module.exports = JRSTheme;

}());
