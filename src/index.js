###*
External API surface for HackMyResume.
@license MIT. See LICENSE.md for details.
@module hackmycore/index
###



###* API facade for HackMyResume. ###

module.exports =

  verbs:
    build:              require './verbs/build'
    analyze:            require './verbs/analyze'
    validate:           require './verbs/validate'
    convert:            require './verbs/convert'
    new:                require './verbs/create'
    peek:               require './verbs/peek'

  alias:
    generate:           require './verbs/build'
    create:             require './verbs/create'

  options:              require './core/default-options'
  formats:              require './core/default-formats'
  Sheet:                require './core/fresh-resume'
  FRESHResume:          require './core/fresh-resume'
  JRSResume:            require './core/jrs-resume'
  FRESHTheme:           require './core/fresh-theme'
  JRSTheme:             require './core/jrs-theme'
  ResumeFactory:        require './core/resume-factory'
  FluentDate:           require './core/fluent-date'
  HtmlGenerator:        require './generators/html-generator'
  TextGenerator:        require './generators/text-generator'
  HtmlPdfCliGenerator:  require './generators/html-pdf-cli-generator'
  WordGenerator:        require './generators/word-generator'
  MarkdownGenerator:    require './generators/markdown-generator'
  JsonGenerator:        require './generators/json-generator'
  YamlGenerator:        require './generators/yaml-generator'
  JsonYamlGenerator:    require './generators/json-yaml-generator'
  LaTeXGenerator:       require './generators/latex-generator'
  HtmlPngGenerator:     require './generators/html-png-generator'
