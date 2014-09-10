## A grid library for your browser

_biggus-griddus_ provides an object model for populating an HTML table from in-memory data.

Styling is performed using CSS.

Supports filtering, sorting and virtualisation of large data sets.

View an [online demo](https://drewnoakes.com/biggus-griddus/demo/) ([source](https://github.com/drewnoakes/biggus-griddus-demo))

---

### TypeScript

_biggus-griddus_ is written in TypeScript, though you don't have to use TypeScript in order to use it.

TypeScript is a nice set of basic extensions to the JavaScript language that add some type safety and
reduces boilerplate code. Files written in TypeScript are compiled to JavaScript via `tsc`.

Install via:

    $ sudo npm install -g typescript

Compile via:

    $ tsc biggus.ts --sourcemap --module amd

This will produce an AMD (RequireJS) module. You may also specify `--module commonjs` for CommonJS modules, or
drop the `--module` option altogether to generate plain JavaScript.

---

### Unit Tests

The project has Jasmine unit tests and is configured to run them using Karma.

Install the Karma command line runner via:

    $ sudo npm install -g karma-cli

In the project folder, load the `npm` modules:

    $ npm update

Start the unit test runner from the command line via:

    $ karma start

To run the unit tests once:

    $ npm test
