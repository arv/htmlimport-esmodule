// Copyright (c) 2014 Erik Arvidsson and contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

(function() {
  'use strict';

  function findMatchingImportElement(doc, address) {
    if (!doc)
      return null;
    var importElements = doc.querySelectorAll('link[rel=import][href]');
    for (var i = 0; i < importElements.length; i++) {
      var importElement = importElements[i];
      if (address === importElement.href)
        return importElement;
      importElement = findMatchingImportElement(importElement.import, address);
      if (importElement)
        return importElement;
    }

    return null;
  }

  var fetch = System.fetch;
  System.fetch = function(load) {
    var address = load.address;
    if (/\.html$/.test(address)) {
      var importElement = findMatchingImportElement(document, address);
      if (importElement) {
        var doc = importElement.import;
        // TODO(arv): If no doc? Add load listener? Reject for now
        if (!doc) {
          return Promise.reject('HTMLImport for ' + address +
              ' has no document. Did it fail to load?');
        }
        var scriptElement =
            doc.querySelector('script[type=module]:not([name])');

        if (!scriptElement) {
          return Promise.reject('HTMLImport for ' + address +
              ' has no matching script type=module');
        }

        return Promise.resolve(scriptElement.innerHTML);
      }
      return Promise.reject('No html import for ' + address);
    }

    return fetch.call(this, load);
  };

  var locate = System.locate;
  System.locate = function(load) {
    var res = locate.call(this, load);
    if (/\.html$/.test(load.name)) {
      return res.slice(0, -3);
    }
    return res;
  };

  function defineModulesInImportElement(importElement) {
    // 1. <module> with no name gets mapped to the URL of the import.
    // 2. <module name=N> gets mapped to URL#name

    var doc = importElement.import;
    var importElements = doc.querySelectorAll('link[rel=import][href]');
    for (var i = 0; i < importElements.length; i++) {
      defineModulesInImportElement(importElements[i]);
    }

    var scriptElement = doc.querySelector('script[type=module]:not([name])');
    if (scriptElement) {
      var name = doc.baseURI;

      // TODO(arv): This looks pretty flawed.
      if (name.indexOf(System.baseURL) === 0)
        name = name.slice(System.baseURL.length);

      // The module might have been registered earlier. Modules are not executed
      // until imported (or instantiated) so force execution.

      if (System.has(name)) {
        System.get(name);
      } else {
        var source = scriptElement.innerHTML;
        System.define(name, source).then(function() {
          System.get(name);
        });
      }
    }
  }

  document.addEventListener('load', function(e) {
    var el = e.target;
    if (el.localName === 'link' && el.rel === 'import') {
      defineModulesInImportElement(el);
    }
  }, true);

})();