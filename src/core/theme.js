/**
Abstract theme representation.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
*/

(function() {

  var FS = require('fs')
    , extend = require('../utils/extend')
    , validator = require('is-my-json-valid')
    , _ = require('underscore')
    , PATH = require('path')
    , EXTEND = require('../utils/extend')
    , moment = require('moment');

  /**
  The Theme class is a representation of a FluentCV theme asset.
  @class Theme
  */
  function Theme() {

  }

  /**
  Open and parse the specified theme.
  */
  Theme.prototype.open = function( themeFolder ) {

    function friendlyName( val ) {
      val = val.trim().toLowerCase();
      var friendly = { yml: 'yaml', md: 'markdown', txt: 'text' };
      return friendly[val] || val;
    }

    // Open the theme.json file; should have the same name as folder
    this.folder = themeFolder;
    var pathInfo = PATH.parse( themeFolder );
    var themeFile = PATH.join( themeFolder, pathInfo.base + '.json' );
    var themeInfo = JSON.parse( FS.readFileSync( themeFile, 'utf8' ) );
    EXTEND( true, this, themeInfo );

    // Iterate over all files in the theme folder, producing an array, fmts,
    // containing info for each file.
    var tplFolder = PATH.join( themeFolder, 'templates' );
    var fmts = FS.readdirSync( tplFolder ).map( function( file ) {
      var absPath = PATH.join( tplFolder, file );
      var pathInfo = PATH.parse(absPath);
      var temp = [ pathInfo.name, {
        title: friendlyName(pathInfo.name),
        pre: pathInfo.name,
        ext: pathInfo.ext.slice(1),
        path: absPath,
        data: FS.readFileSync( absPath, 'utf8' ),
        css: null
      }];
      return temp;
    });

    // Add freebie formats every theme gets
    fmts.push( [ 'json', { title: 'json', pre: 'json', ext: 'json', path: null, data: null } ] );
    fmts.push( [ 'yml', { title: 'yaml', pre: 'yml', ext: 'yml', path: null, data: null } ] );

    // Now, get all the CSS files...
    this.cssFiles = fmts.filter(function( fmt ){ return fmt[1].ext === 'css'; });

    // ...and assemble information on them
    this.cssFiles.forEach(function( cssf ) {
      // For each CSS file, get its corresponding HTML file
      var idx = _.findIndex(fmts, function( fmt ) {
        return fmt[1].pre === cssf[1].pre && fmt[1].ext === 'html'
      });
      fmts[ idx ][1].css = cssf[1].data;
      fmts[ idx ][1].cssPath = cssf[1].path;
    });

    // Remove CSS files from the formats array
    fmts = fmts.filter( function( fmt) {
      return fmt[1].ext !== 'css';
    });

    // Create a hash out of the formats for this theme
    this.formats = _.object( fmts );

    // Set the official theme name
    this.name = PATH.parse( themeFolder ).name;

    return this;
  };

  /**
  Determine if the theme supports the specified output format.
  */
  Theme.prototype.hasFormat = function( fmt ) {
    return _.has( this.formats, fmt );
  };

  /**
  Determine if the theme supports the specified output format.
  */
  Theme.prototype.getFormat = function( fmt ) {
    return this.formats[ fmt ];
  };

  module.exports = Theme;

}());
