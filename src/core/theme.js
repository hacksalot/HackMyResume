/**
Definition of the Theme class.
@license MIT. Copyright (c) 2015 hacksalot / FluentDesk.
@module theme.js
*/

(function() {

  var FS = require('fs')
    , extend = require('../utils/extend')
    , validator = require('is-my-json-valid')
    , _ = require('underscore')
    , PATH = require('path')
    , parsePath = require('parse-filepath')
    , pathExists = require('path-exists').sync
    , EXTEND = require('../utils/extend')
    , moment = require('moment')
    , RECURSIVE_READ_DIR = require('recursive-readdir-sync');

  /**
  The Theme class is a representation of a HackMyResume theme asset.
  @class Theme
  */
  function Theme() {

  }

  /**
  Open and parse the specified theme.
  */
  Theme.prototype.open = function( themeFolder ) {

    this.folder = themeFolder;

    // Open the [theme-name].json file; should have the same name as folder
    var pathInfo = parsePath( themeFolder );

    // Set up a formats hash for the theme
    var formatsHash = { };

    // See if the theme has a package.json. If so, load it.
    var packageJsonPath = PATH.join(themeFolder, 'package.json');
    if( pathExists( packageJsonPath ) ) {
      var themePack = require( themeFolder );
      var themePkgJson = require( packageJsonPath );
      this.name = themePkgJson.name;
      this.render = (themePack && themePack.render) || undefined;
      this.formats = { html: { title: 'html', outFormat: 'html', ext: 'html', path: null, data: null } };
      return this;
    }

    // Otherwise, do a full theme load
    var themeFile = PATH.join( themeFolder, pathInfo.basename + '.json' );
    var themeInfo = JSON.parse( FS.readFileSync( themeFile, 'utf8' ) );
    var that = this;

    // Move properties from the theme JSON file to the theme object
    EXTEND( true, this, themeInfo );

    // Check for an explicit "formats" entry in the theme JSON. If it has one,
    // then this theme declares its files explicitly.
    if( !!this.formats ) {
      formatsHash = loadExplicit.call( this );
      this.explicit = true;
    }
    else {
      formatsHash = loadImplicit.call( this );
    }

    // Add freebie formats every theme gets
    formatsHash.json = { title: 'json', outFormat: 'json', pre: 'json', ext: 'json', path: null, data: null };
    formatsHash.yml = { title: 'yaml', outFormat: 'yml', pre: 'yml', ext: 'yml', path: null, data: null };

    // Cache
    this.formats = formatsHash;

    // Set the official theme name
    this.name = parsePath( this.folder ).name;

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

  function loadImplicit() {

    // Set up a hash of formats supported by this theme.
    var formatsHash = { };
    var that = this;
    var major = false;

    // Establish the base theme folder
    var tplFolder = PATH.join( this.folder, 'src' );

    // Iterate over all files in the theme folder, producing an array, fmts,
    // containing info for each file. While we're doing that, also build up
    // the formatsHash object.
    var fmts = RECURSIVE_READ_DIR( tplFolder ).map( function( absPath ) {

      // If this file lives in a specific format folder within the theme,
      // such as "/latex" or "/html", then that format is the output format
      // for all files within the folder.
      var pathInfo = parsePath(absPath);
      var outFmt = '', isMajor = false;
      var portion = pathInfo.dirname.replace(tplFolder,'');
      if( portion && portion.trim() ) {
        if( portion[1] === '_' ) return;
        var reg = /^(?:\/|\\)(html|latex|doc|pdf|partials)(?:\/|\\)?/ig;
        var res = reg.exec( portion );
        if( res ) {
          if( res[1] !== 'partials' ) {
            outFmt = res[1];
          }
          else {
            that.partials = that.partials || [];
            that.partials.push( { name: pathInfo.name, path: absPath } );
            return null;
          }
        }
      }

      // Otherwise, the output format is inferred from the filename, as in
      // compact-[outputformat].[extension], for ex, compact-pdf.html.
      if( !outFmt ) {
        var idx = pathInfo.name.lastIndexOf('-');
        outFmt = ( idx === -1 ) ? pathInfo.name : pathInfo.name.substr( idx + 1 );
        isMajor = true;
      }

      // We should have a valid output format now.
      formatsHash[ outFmt ] = formatsHash[outFmt] || {
        outFormat: outFmt,
        files: []
      };

      // Create the file representation object.
      var obj = {
        action: 'transform',
        path: absPath,
        major: isMajor,
        orgPath: PATH.relative(tplFolder, absPath),
        ext: pathInfo.extname.slice(1),
        title: friendlyName( outFmt ),
        pre: outFmt,
        // outFormat: outFmt || pathInfo.name,
        data: FS.readFileSync( absPath, 'utf8' ),
        css: null
      };

      // Add this file to the list of files for this format type.
      formatsHash[ outFmt ].files.push( obj );
      return obj;
    });

    // Now, get all the CSS files...
    (this.cssFiles = fmts.filter(function( fmt ){ return fmt && (fmt.ext === 'css'); }))
    .forEach(function( cssf ) {
      // For each CSS file, get its corresponding HTML file
      var idx = _.findIndex(fmts, function( fmt ) {
        return fmt && fmt.pre === cssf.pre && fmt.ext === 'html';
      });
      cssf.action = null;
      fmts[ idx ].css = cssf.data;
      fmts[ idx ].cssPath = cssf.path;
    });

    // Remove CSS files from the formats array
    fmts = fmts.filter( function( fmt) {
      return fmt && (fmt.ext !== 'css');
    });

    return formatsHash;
  }

  function loadExplicit() {

    var that = this;
    // Set up a hash of formats supported by this theme.
    var formatsHash = { };

    // Establish the base theme folder
    var tplFolder = PATH.join( this.folder, 'src' );

    var act = null;

    // Iterate over all files in the theme folder, producing an array, fmts,
    // containing info for each file. While we're doing that, also build up
    // the formatsHash object.
    var fmts = RECURSIVE_READ_DIR( tplFolder ).map( function( absPath ) {

      act = null;
      // If this file is mentioned in the theme's JSON file under "transforms"
      var pathInfo = parsePath(absPath);
      var absPathSafe = absPath.trim().toLowerCase();
      var outFmt = _.find( Object.keys( that.formats ), function( fmtKey ) {
        var fmtVal = that.formats[ fmtKey ];
        return _.some( fmtVal.transform, function( fpath ) {
          var absPathB = PATH.join( that.folder, fpath ).trim().toLowerCase();
          return absPathB === absPathSafe;
        });
      });
      if( outFmt ) {
        act = 'transform';
      }

      // If this file lives in a specific format folder within the theme,
      // such as "/latex" or "/html", then that format is the output format
      // for all files within the folder.
      if( !outFmt ) {
        var portion = pathInfo.dirname.replace(tplFolder,'');
        if( portion && portion.trim() ) {
          var reg = /^(?:\/|\\)(html|latex|doc|pdf)(?:\/|\\)?/ig;
          var res = reg.exec( portion );
          res && (outFmt = res[1]);
        }
      }

      // Otherwise, the output format is inferred from the filename, as in
      // compact-[outputformat].[extension], for ex, compact-pdf.html.
      if( !outFmt ) {
        var idx = pathInfo.name.lastIndexOf('-');
        outFmt = ( idx === -1 ) ? pathInfo.name : pathInfo.name.substr( idx + 1 );
      }

      // We should have a valid output format now.
      formatsHash[ outFmt ] =
        formatsHash[ outFmt ] || {
          outFormat: outFmt,
          files: [],
          symLinks: that.formats[ outFmt ].symLinks
        };

      // Create the file representation object.
      var obj = {
        action: act,
        orgPath: PATH.relative(that.folder, absPath),
        path: absPath,
        ext: pathInfo.extname.slice(1),
        title: friendlyName( outFmt ),
        pre: outFmt,
        // outFormat: outFmt || pathInfo.name,
        data: FS.readFileSync( absPath, 'utf8' ),
        css: null
      };

      // Add this file to the list of files for this format type.
      formatsHash[ outFmt ].files.push( obj );
      return obj;
    });

    // Now, get all the CSS files...
    (this.cssFiles = fmts.filter(function( fmt ){ return fmt.ext === 'css'; }))
    .forEach(function( cssf ) {
        // For each CSS file, get its corresponding HTML file
        var idx = _.findIndex(fmts, function( fmt ) {
          return fmt.pre === cssf.pre && fmt.ext === 'html';
      });
      fmts[ idx ].css = cssf.data;
      fmts[ idx ].cssPath = cssf.path;
    });

    // Remove CSS files from the formats array
    fmts = fmts.filter( function( fmt) {
      return fmt.ext !== 'css';
    });

    return formatsHash;
  }

  function friendlyName( val ) {
    val = val.trim().toLowerCase();
    var friendly = { yml: 'yaml', md: 'markdown', txt: 'text' };
    return friendly[val] || val;
  }

  module.exports = Theme;

}());
