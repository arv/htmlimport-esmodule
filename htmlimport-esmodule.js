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

  var moduleTagSelector = 'script[type=module]:not([name]):not([href])';
  var importTagSelector = 'link[rel=import][href]';

  /**
   * Recursively looks through all imported documents looking for
   * link[rel=import] that matches a certain address.
   */
  function findMatchingImportElement(doc, address) {
    if (!doc)
      return null;
    var importElements = doc.querySelectorAll(importTagSelector);
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
            doc.querySelector(moduleTagSelector);

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
      // The default locate adds '.js'. Remove it.
      return res.slice(0, -3);
    }
    return res;
  };

  function defineModulesInImportElement(importElement) {
    // Recursively finds script[type=module] in all import documents
    // and defines and executes them.

    var doc = importElement.import;
    var importElements = doc.querySelectorAll(importTagSelector);
    for (var i = 0; i < importElements.length; i++) {
      defineModulesInImportElement(importElements[i]);
    }

    var scriptElement = doc.querySelector(moduleTagSelector);
    if (scriptElement) {
      var name = doc.baseURI;

      // TODO(arv): This looks pretty flawed. Would need a less error prone way
      // to define something when all we have is a URL.
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