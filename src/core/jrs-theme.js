/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the JRSTheme class.
@module core/jrs-theme
@license MIT. See LICENSE.MD for details.
*/



const _ = require('underscore');
const PATH = require('path');
const pathExists = require('path-exists').sync;
const errors = require('./status-codes');



/**
The JRSTheme class is a representation of a JSON Resume theme asset.
@class JRSTheme
*/
class JRSTheme {



  /**
  Open and parse the specified JRS theme.
  @method open
  */
  open( thFolder ) {

    this.folder = thFolder;
    //const pathInfo = parsePath(thFolder);

    // Open and parse the theme's package.json file
    const pkgJsonPath = PATH.join(thFolder, 'package.json');
    if (pathExists(pkgJsonPath)) {
      const thApi = require(thFolder);     // Requiring the folder yields whatever the package.json's "main" is set to
      const thPkg = require(pkgJsonPath);  // Get the package.json as JSON
      this.name = thPkg.name;
      this.render = (thApi && thApi.render) || undefined;
      this.engine = 'jrs';

      // Create theme formats (HTML and PDF). Just add the bare minimum mix of
      // properties necessary to allow JSON Resume themes to share a rendering
      // path with FRESH themes.
      this.formats = {
        html: {
          outFormat: 'html',
          files: [{
            action: 'transform',
            render: this.render,
            primary: true,
            ext: 'html',
            css: null
          }]
        },
        pdf: {
          outFormat: 'pdf',
          files: [{
            action: 'transform',
            render: this.render,
            primary: true,
            ext: 'pdf',
            css: null
          }]
        }
      };
    } else {
      throw {fluenterror: errors.missingPackageJSON};
    }
    return this;
  }



  /**
  Determine if the theme supports the output format.
  @method hasFormat
  */
  hasFormat( fmt ) {  return _.has(this.formats, fmt); }



  /**
  Return the requested output format.
  @method getFormat
  */
  getFormat( fmt ) { return this.formats[ fmt ]; }
}


module.exports = JRSTheme;
