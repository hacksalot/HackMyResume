fluentcmd
=========
The command-line FluentCV application for Linux, Windows, and OS X.

## Use

First make sure [Node.js][4] and [NPM][5] are installed. Then:

1. Install the latest official [PhantomJS][2] and [wkhtmltopdf][3] binaries for your platform.
2. Verify PhantomJS and wkhtml are accessible on your path.
3. Run `npm install` followed by `npm link`.
4. Run fluentcmd from with `fluentcmd [input] [output] -t [theme]`. For example:

  ```bash
  # Generate all resume formats (HTML, PDF, DOC, TXT)
  fluentcmd resume.json resume.all -t informatic

  # Generate a specific resume format
  fluentcmd resume.json resume.html -t informatic
  fluentcmd resume.json resume.txt -t informatic
  fluentcmd resume.json resume.pdf -t informatic
  fluentcmd resume.json resume.doc -t informatic
  ```

5. Success looks like this:

  ```
  *** FluentCMD v0.1.0 ***
  Reading JSON resume: foo/resume.json
  Generating HTML resume: out/resume.html
  Generating TXT resume: out/resume.txt
  Generating DOC resume: out/resume.doc
  Generating PDF resume: out/resume.pdf
  ```

## Advanced

You can **merge multiple resumes** by specifying them in order from most generic to most specific:

```bash
# Merge specific.json onto base.json and generate all formats
fluentcmd base.json specific.json resume.all -t informatic
```

You can specify **multiple output filenames** instead of using `.all`:

```bash
# Merge specific.json onto base.json and generate r1.doc and r2.pdf
fluentcmd base.json specific.json r1.doc r2.pdf -t informatic
```

You can omit the output file(s) and/or theme completely:

```bash
# Equivalent to "fluentcmd resume.json resume.all -t default"
fluentcmd resume.json
```

## License

Proprietary and confidential. See [LICENSE.md][1] for details.

[1]: LICENSE.md
[2]: http://phantomjs.org/
[3]: http://wkhtmltopdf.org/
[4]: https://nodejs.org/
[5]: https://www.npmjs.com/
