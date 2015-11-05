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
    , moment = require('moment');

  /**
  The Theme class represents a specific presentation of a resume.
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

    // Remember the theme folder; might be custom
    this.folder = themeFolder;
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

    // Freebie formats every theme gets
    fmts.push( [ 'json', { title: 'json', pre: 'json', ext: 'json', path: null, data: null } ] );
    fmts.push( [ 'yml', { title: 'yaml', pre: 'yml', ext: 'yml', path: null, data: null } ] );

    // Handle CSS files
    var cssFiles = fmts.filter(function( fmt ){
      return fmt[1].ext === 'css';
    });
    cssFiles.forEach(function( cssf ) {
      // For each CSS file, get its corresponding HTML file
      var idx = _.findIndex(fmts, function( fmt ) { return fmt[1].pre === cssf[1].pre && fmt[1].ext === 'html' });
      fmts[ idx ][1].css = cssf[1].data;
      fmts[ idx ][1].cssPath = cssf[1].path;
    });
    fmts = fmts.filter( function( fmt) {
      return fmt[1].ext !== 'css';
    });

    // Create a hash out of the formats for this theme
    this.formats = _.object( fmts );

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
