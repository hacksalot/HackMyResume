Building
========

*See [CONTRIBUTING.md][contrib] for more information on contributing to the
HackMyResume or FluentCV projects.*

HackMyResume is a standard Node.js command line app implemented in a mix of
CoffeeScript and JavaScript. Setting up a build environment is easy:


## Prerequisites ##

1. OS: Linux, OS X, or Windows

2. Install [Node.js][node] and [Grunt][grunt].


## Set up a build environment ###

1. Fork [hacksalot/HackMyResume][hmr] to your GitHub account.

2. Clone your fork locally.

3. From within the top-level HackMyResume folder, run `npm install` to install
project dependencies.

4. Create a new branch, based on the latest HackMyResume `dev` branch, to
contain your work.

5. Run `npm link` in the HackMyResume folder so that the `hackmyresume` command
will reference your local installation (you may need to
`npm uninstall -g hackmyresume` first).

## Making changes

1. HackMyResume sources live in the [`/src`][src] folder. Always make your edits
there, never in the generated `/dist` folder.

2. After making your changes, run `grunt build` to package the HackMyResume
sources to the `/dist` folder. This will transform CoffeeScript files to
JavaScript and perform other build steps as necessary. In the future, a watch
task or guardfile will be added to automate this step.

3. Do local spot testing with `hackmyresume` as normal.

4. When you're ready to submit your changes, run `grunt test` to run the HMR
test suite. Fix any errors that occur.

5. Commit and push your changes.

6. Submit a pull request targeting the HackMyResume `dev` branch.


[node]: https://nodejs.org/en/
[grunt]: http://gruntjs.com/
[hmr]: https://github.com/hacksalot/HackMyResume
[src]: https://github.com/hacksalot/HackMyResume/tree/master/src
[contrib]: https://github.com/hacksalot/HackMyResume/blob/master/CONTRIBUTING.md
