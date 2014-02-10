HTMLImport & ES6 Module
===================

HTMLImport & ES6 Module sitting in a tree, K-I-S-S-I-N-G.

This is an exploration of using ES6 modules in compination with HTMLImports.

### Basics

An HTMLImport is treated as an ES6 module. The HTMLImport can export things using a single module tag [1] with exports.

```html
// a.html
<script type="module">
export var a = 'A';
</script>
```

To import from an HTMLImport you need to use both a `link[rel=import]` as well as an ImportDeclaration.

```html
// test.html
<link rel="import" href="a.html">
<script type="module">
import {a} from './a.html';
</script>
```

The module name has a special form, ending in `.html`. The module name is assiociated with the first module tag [1] inside the HMTL import file, which you currently have to also include in your page.

### Details

This prototype uses https://github.com/ModuleLoader/es6-module-loader, https://github.com/google/traceur-compiler and requires native support for HTMLImports (check your chrome://flags).

To get started you need to include two script files, probably before any `link[rel=import]`.

```html
<script src="es6-module-loader.js"></script>
<script src="htmlimport-esmodule.js"></script>
```

### TODOs

   * Allow imports to work without a link tag. We can inject the link tag as needed.

[1] Module tags are represented by `<script type="module">`
