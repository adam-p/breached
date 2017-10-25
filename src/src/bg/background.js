/*
 * Copyright Adam Pritchard 2017
 * MIT License : http://adampritchard.mit-license.org/
 */

"use strict";

// Watch for tab loads, so we can update the button.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    // Initially disable the button.
    chrome.browserAction.disable(tabId);

    lookUpURL(tab.url, breaches => {
      if (breaches) {
        // There are breaches! Enable the button.
        chrome.browserAction.setTitle({title: 'Breached!', tabId: tabId});
        chrome.browserAction.setBadgeText({text: String(breaches.length), tabId: tabId});
        chrome.browserAction.setBadgeBackgroundColor({color: '#FF0000', tabId: tabId})
        chrome.browserAction.enable(tabId);
      }
      else {
        // No breaches.
        chrome.browserAction.setTitle({title: 'Not Breached', tabId: tabId});
        chrome.browserAction.setBadgeText({text: '', tabId: tabId});
        chrome.browserAction.disable(tabId);
      }
    });

    updateDB();
  }
});

/**
 * Check if the breach DB is current. Start an update if it's not.
 */
function updateDB() {
  chrome.storage.local.get('dbTimestamp', res => {
    if (res['dbTimestamp'] && new Date().getTime() - res['dbTimestamp'] < 86400000) {
      // DB is newer than a day, so don't update.
      return;
    }

    console.log('Updating breach DB');

    // Update the DB.
    $.getJSON('https://haveibeenpwned.com/api/v2/breaches', data => {
      // We're going to store breaches keyed on domain, so they're easier to look up.
      // A breach may have no domain. Multiple breaches may have the same domain.
      // Our structure:
      //  {'example.com': [breach1, breach2, ...], ...}
      var dbObj = {};

      for (let i = data.length-1; i >= 0; i--) {
        let domain = data[i]['Domain'];
        if (!domain) {
          continue;
        }

        if (!dbObj[domain]) {
          dbObj[domain] = [];
        }

        dbObj[domain].push(data[i]);
      }

      dbObj['dbTimestamp'] = new Date().getTime();

      chrome.storage.local.set(dbObj);
    });
  });
}

/**
 * Look up a URL's hostname in the breach DB. If it's not found, null is passed to
 * callback. Otherwise an array of breaches is passed.
 * @param {string} url
 * @param {function(object[])} callback
 */
function lookUpURL(url, callback) {
  // We're going to try to match against the full hostname, and then one piece shorter, etc. (but not the TLD).
  // E.g.: ['sub2.sub1.example.com', 'sub1.example.com', 'example.com']
  let currHostnameSplit = new URL(url).hostname.split('.');
  let currHostnames = [];
  for (let i = 0; i < currHostnameSplit.length-1; i++) {
    currHostnames.push(currHostnameSplit.slice(i).join('.'));
  }

  // Look up all of the hostnames
  chrome.storage.local.get(currHostnames, res => {
    // Look for results from most precise to least.
    for (let hostname of currHostnames) {
      if (res[hostname]) {
        // Got one, send it back.
        callback(res[hostname]);
        return;
      }
    }

    // No result was found for the current tab's hostname.
    callback(null);
  });
}

// Listen for requests from the browser action popup to get info about a site.
chrome.runtime.onMessage.addListener((request, sender, responseCallback) => {
  if (request.action === 'siteInfo') {
    // We've received a request for breach info.
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      if (!tabs || !tabs.length) {
        // There's no current tab, so there's nothing we can do.
        responseCallback(null);
        return;
      }

      lookUpURL(tabs[0].url, response => {
        // We need to add a bit more to the response, so create an object.
        let responseObj = {
          favicon: tabs[0].favIconUrl,
          breaches: response
        };

        responseCallback(responseObj);
      });

    });

    // Indicate an async callback.
    return true;
  }

  return false;
});

// Disable immediately, until tabs start loading.
chrome.browserAction.disable();
