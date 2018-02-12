(function() {
  /**
  Definition of the HandlebarsGenerator class.
  @license MIT. See LICENSE.md for details.
  @module renderers/handlebars-generator
  */
  /**
  Perform template-based resume generation using Handlebars.js.
  @class HandlebarsGenerator
  */
  var FS, HANDLEBARS, HMSTATUS, HandlebarsGenerator, PATH, READFILES, SLASH, _, parsePath, registerHelpers, registerPartials;

  _ = require('underscore');

  HANDLEBARS = require('handlebars');

  FS = require('fs');

  registerHelpers = require('../helpers/handlebars-helpers');

  PATH = require('path');

  parsePath = require('parse-filepath');

  READFILES = require('recursive-readdir-sync');

  HMSTATUS = require('../core/status-codes');

  SLASH = require('slash');

  HandlebarsGenerator = module.exports = {
    generateSimple: function(data, tpl) {
      var err, template;
      try {
        // Compile and run the Handlebars template.
        template = HANDLEBARS.compile(tpl, {
          strict: false,
          assumeObjects: false,
          noEscape: data.opts.noescape
        });
        return template(data);
      } catch (error1) {
        err = error1;
        throw {
          fluenterror: HMSTATUS[template ? 'invokeTemplate' : 'compileTemplate'],
          inner: err
        };
      }
    },
    generate: function(json, jst, format, curFmt, opts, theme) {
      var ctx, encData;
      // Preprocess text
      encData = json;
      if (format === 'html' || format === 'pdf') {
        encData = json.markdownify();
      }
      if (format === 'doc') {
        encData = json.xmlify();
      }
      // Set up partials and helpers
      registerPartials(format, theme);
      registerHelpers(theme, encData, opts);
      // Set up the context
      ctx = {
        r: encData,
        RAW: json,
        filt: opts.filters,
        format: format,
        opts: opts,
        engine: this,
        results: curFmt.files,
        headFragment: opts.headFragment || ''
      };
      // Render the template
      return this.generateSimple(ctx, jst);
    }
  };

  registerPartials = function(format, theme) {
    var partialsFolder;
    if (_.contains(['html', 'doc', 'md', 'txt', 'pdf'], format)) {
      // Locate the global partials folder
      partialsFolder = PATH.join(parsePath(require.resolve('fresh-themes')).dirname, '/partials/', format === 'pdf' ? 'html' : format);
      // Register global partials in the /partials/[format] folder
      // TODO: Only do this once per HMR invocation.
      _.each(READFILES(partialsFolder, function(error) {
        return {};
      }), function(el) {
        var compiledTemplate, name, pathInfo, tplData;
        pathInfo = parsePath(el);
        name = SLASH(PATH.relative(partialsFolder, el).replace(/\.(?:html|xml|hbs|md|txt)$/i, ''));
        tplData = FS.readFileSync(el, 'utf8');
        compiledTemplate = HANDLEBARS.compile(tplData);
        HANDLEBARS.registerPartial(name, compiledTemplate);
        return theme.partialsInitialized = true;
      });
    }
    // Register theme-specific partials
    return _.each(theme.partials, function(el) {
      var compiledTemplate, tplData;
      tplData = FS.readFileSync(el.path, 'utf8');
      compiledTemplate = HANDLEBARS.compile(tplData);
      return HANDLEBARS.registerPartial(el.name, compiledTemplate);
    });
  };

}).call(this);

//# sourceMappingURL=handlebars-generator.js.map
