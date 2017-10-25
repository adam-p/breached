/*
 * Copyright Adam Pritchard 2017
 * MIT License : http://adampritchard.mit-license.org/
 */

$(() => {
  chrome.runtime.sendMessage({action: 'siteInfo'}, breaches => {
    if (!breaches || breaches.length === 0) {
      return;
    }

    let breachHTML = '';

    for (let breach of breaches) {
      if (breachHTML) {
        breachHTML += '<hr/>';
      }
      else {
        breachHTML += html`<h2>${breach['Domain']}</h2>`;
      }

      breachHTML += html`
      <h3>${breach['Title']}</h3>
      <h4>${breach['PwnCount'].toLocaleString()} accounts pwned</h4>
      <p>${breach['Description']}</p>
      Compromised data: ${breach['DataClasses'].join(', ')}
      `;
    }

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
