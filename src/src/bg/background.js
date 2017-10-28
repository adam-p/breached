/*
 * Copyright Adam Pritchard 2017
 * MIT License : http://adampritchard.mit-license.org/
 */

"use strict";

// Watch for tab loads, so we can update the button.
chrome.tabs.onUpdated.addListener(tabUpdated);

/**
 * Called when a tab is updated. If the tab is loading we will update the browser action button.
 * @param {integer} tabId
 * @param {object} changeInfo
 * @param {object} tab
 */
function tabUpdated(tabId, changeInfo, tab) {
  if (changeInfo.status === 'loading') {
    // Initially hide the button.
    chrome.pageAction.hide(tabId);

    lookUpURL(tab.url, breaches => {
      if (breaches && breaches.length > 0) {
        // There are breaches! Show the button and notification.
        chrome.pageAction.show(tabId);
        showNotification(breaches);
      }
      else {
        // No breaches.
        chrome.pageAction.hide(tabId);
      }
    });

    updateDB();
  }
}

// Listen for notification clicks and open the appropriate info page.
chrome.notifications.onClicked.addListener(notificationClicked);

/**
 * Notification click handler. Will open the appropriate web page.
 * @param {string} notificationId Is set the "name" of the breach.
 */
function notificationClicked(notificationId) {
  if (notificationId) {
    chrome.tabs.create({url: `https://haveibeenpwned.com/PwnedWebsites#${notificationId}`});
  }
}

/**
 * Shows a notification regarding breaches for a current page. Only shows a notification for a site once.
 * @param {object[]} breaches Breach information for the notification.
 */
function showNotification(breaches) {
  if (!breaches || breaches.length === 0) {
    return;
  }

  // We only want to show a notification once for each affected domain, unless the breach info changes for it.
  let notificationKey = `${breaches[0]['Domain']}_${breaches.length}`;
  chrome.storage.local.get('notifications', res => {
    if (res.notifications && res.notifications[notificationKey]) {
      // We've already shown a notification for this domain and breach state.
      return;
    }

    // Flag that we've shown this notification.
    res[notificationKey] = true;
    chrome.storage.local.set({notifications: res});

    // Show the notification.
    let totalPwned = 0;
    for (let breach of breaches) {
      totalPwned += breach['PwnCount'];
    }

    let message = '';
    if (breaches.length === 1) {
      message = `1 breach, ${totalPwned.toLocaleString()} accounts pwned.\nClick here or on the button for more info.`;
    }
    else {
      message = `${breaches.length} breaches, ${totalPwned.toLocaleString()} accounts pwned.\nClick here or on the button for more info.`;
    }

    let contextMessage = null;
    // Notifications on MacOS are very small, so we won't use a context message there.
    if (navigator.userAgent.indexOf('Macintosh') < 0) {
      contextMessage = 'Data from haveibeenpwned.com';
    }

    let opt = {
      type: 'basic',
      title: `${breaches[0]['Domain']} has breach history`,
      message: message,
      contextMessage: contextMessage,
      iconUrl: '/icons/icon64.png'
    };
    chrome.notifications.create(breaches[0]['Name'], opt);
  });
}

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
 * @param {string} url The URL to look up in the breach DB
 * @param {function(object[])} callback Will be called with the lookup results. Passed null if no match, otherwise an array of breaches.
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
chrome.runtime.onMessage.addListener(messageListener);

/**
 * Receives messages from the browser action popup, requesting breach info to display.
 * @param {*} request
 * @param {*} sender
 * @param {*} responseCallback
 * @returns {boolean} true if this is asynchronous.
 */
function messageListener(request, sender, responseCallback) {
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
}
