/*
 * Copyright Adam Pritchard 2017
 * MIT License : http://adampritchard.mit-license.org/
 */

$(() => {
  "use strict";

  chrome.runtime.sendMessage({action: 'siteInfo'}, response => {
    if (!response || response.breaches.length === 0) {
      return;
    }

    let breachHTML = '';

    for (let breach of response.breaches) {
      if (!breachHTML) {
        breachHTML += html`
          <h2>
            ${response.favicon
              ? html`<img src="${response.favicon}" style="height:1em;vertical-align:text-top">`
              : ''}
            ${breach['Domain']}
          </h2>
        `;
      }

      breachHTML += html`
        <h3>
          <a target="_blank" href="https://haveibeenpwned.com/PwnedWebsites#${breach['Name']}">
            ${breach['Title']}
          </a>
        </h3>
        <h4>${breach['PwnCount'].toLocaleString()} accounts pwned</h4>
        <p>${breach['Description']}</p>
        <p>Compromised data: ${breach['DataClasses'].join(', ')}</p>
        <hr/>
      `;
    }

    breachHTML += `
      <p style="text-align:center">
        Register to be notified when <em>your</em> account is pwned at<br>
        <a target="_blank" href="https://haveibeenpwned.com/">haveibeenpwned.com</a>
      </p>
    `

    $('#mainPopup').html(breachHTML);
  });
});

// From http://2ality.com/2015/01/template-strings-html.html
function html(literalSections, ...substs) {
  // Use raw literal sections: we don’t want backslashes (\n etc.) to be interpreted
  let raw = literalSections.raw;

  let result = '';

  substs.forEach((subst, i) => {
      // Retrieve the literal section preceding the current substitution
      let lit = raw[i];

      // In the example, map() returns an array:
      // If substitution is an array (and not a string), we turn it into a string
      if (Array.isArray(subst)) {
          subst = subst.join('');
      }

      // If the substitution is preceded by a dollar sign, we escape special characters in it
      if (lit.endsWith('$')) {
          subst = htmlEscape(subst);
          lit = lit.slice(0, -1);
      }
      result += lit;
      result += subst;
  });
  // Take care of last literal section
  // (Never fails, because an empty template string
  // produces one literal section, an empty string)
  result += raw[raw.length-1]; // (A)

  return result;
}
