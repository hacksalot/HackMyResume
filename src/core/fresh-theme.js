/**
Definition of the FRESHTheme class.
@module fresh-theme.js
@license MIT. See LICENSE.md for details.
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
    , READFILES = require('recursive-readdir-sync');



  /**
  The FRESHTheme class is a representation of a FRESH theme
  asset. See also: JRSTheme.
  @class FRESHTheme
  */
  function FRESHTheme() {

  }



  /**
  Open and parse the specified theme.
  */
  FRESHTheme.prototype.open = function( themeFolder ) {

    this.folder = themeFolder;

    // Open the [theme-name].json file; should have the same name as folder
    var pathInfo = parsePath( themeFolder );

    // Set up a formats hash for the theme
    var formatsHash = { };

    // Load the theme
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

    // Cache
    this.formats = formatsHash;

    // Set the official theme name
    this.name = parsePath( this.folder ).name;

    return this;
  };



  /**
  Determine if the theme supports the specified output format.
  */
  FRESHTheme.prototype.hasFormat = function( fmt ) {
    return _.has( this.formats, fmt );
  };



  /**
  Determine if the theme supports the specified output format.
  */
  FRESHTheme.prototype.getFormat = function( fmt ) {
    return this.formats[ fmt ];
  };


  /**
  Load the theme implicitly, by scanning the theme folder for
  files. TODO: Refactor duplicated code with loadExplicit.
  */
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
    var fmts = READFILES(tplFolder).map( function(absPath) {

      // If this file lives in a specific format folder within the theme,
      // such as "/latex" or "/html", then that format is the output format
      // for all files within the folder.
      var pathInfo = parsePath(absPath);
      var outFmt = '', isMajor = false;
      var portion = pathInfo.dirname.replace(tplFolder,'');
      if( portion && portion.trim() ) {
        if( portion[1] === '_' ) return;
        var reg = /^(?:\/|\\)(html|latex|doc|pdf|png|partials)(?:\/|\\)?/ig;
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
        outFmt = (idx === -1) ? pathInfo.name : pathInfo.name.substr(idx + 1);
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
    (this.cssFiles = fmts.filter(function( fmt ){
      return fmt && (fmt.ext === 'css');
    }))

    // For each CSS file, get its corresponding HTML file
    .forEach(function( cssf ) {

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



  /**
  Load the theme explicitly, by following the 'formats' hash
  in the theme's JSON settings file.
  */
  function loadExplicit() {

    // Housekeeping
    var formatsHash = { };
    var tplFolder = PATH.join( this.folder, 'src' );
    var act = null;
    var that = this;

    // Iterate over all files in the theme folder, producing an array, fmts,
    // containing info for each file. While we're doing that, also build up
    // the formatsHash object.
    var fmts = READFILES( tplFolder ).map( function( absPath ) {

      act = null;
      // If this file is mentioned in the theme's JSON file under "transforms"
      var pathInfo = parsePath(absPath);
      var absPathSafe = absPath.trim().toLowerCase();
      var outFmt = _.find(
        Object.keys( that.formats ),
        function( fmtKey ) {
          var fmtVal = that.formats[ fmtKey ];
          return _.some( fmtVal.transform, function(fpath) {
            var absPathB = PATH.join( that.folder, fpath )
              .trim().toLowerCase();
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
        outFmt = (idx === -1) ? pathInfo.name : pathInfo.name.substr(idx + 1);
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
    (this.cssFiles = fmts.filter(function( fmt ){
      return fmt.ext === 'css';
    }))

    // For each CSS file, get its corresponding HTML file
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



  /**
  Return a more friendly name for certain formats.
  TODO: Refactor
  */
  function friendlyName( val ) {
    val = val.trim().toLowerCase();
    var friendly = { yml: 'yaml', md: 'markdown', txt: 'text' };
    return friendly[val] || val;
  }



  module.exports = FRESHTheme;



}());
