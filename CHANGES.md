Change Log
==========

2017-11-18: v1.2.1
------------------

* Fixed bug [#2](https://github.com/adam-p/breached/issues/2): Some breach entries don't have a 'Domain' set, but do reference one or more domains. They will now be tracked as well. Thanks to [Madis](https://github.com/Madis0) for reporting it.

* Fixed bug: Suppression of multiple notifications for a single domain may not have worked in all cases.


2017-10-28: v1.2.0
------------------

* Switched from browser action to page action. This was prompted by a review from user [tulirebane](https://addons.mozilla.org/en-US/firefox/addon/breached/reviews/940746/). Note that this will result in no visual changes in Chrome, but it will in Firefox. For discussion of page actions versus browser actions, check out this [blog post](http://crypti.cc/blog/2013/03/24/pageaction-interaction) (that I'll update with recent thoughts and discoveries).

* Made the notification text more concise. On MacOS the notifications are very tight for space.


2017-10-24: v1.1.0
------------------

* Added notifications. The enabling and badging of the toolbar button weren't visible enough. Also, users couldn't be blamed for hiding the toolbar button. The notification does a better job bringing a attention to a breached site. It's only being shown once for a domain (unless there's a new breach), so it shouldn't be too annoying.


2017-10-24: v1.0.1
------------------

* Update toolbar button when tab begins loading rather than when it's finished. This makes it more noticeable to the user who is waiting for the tab to load. (And there's nothing that relies on the tab being fully loaded.)

* Show the page favicon in the toolbar popup.

* Add more links to haveibeenpwned.com in the popup.

* Fixed icon images.


2017-10-24: v0.0.1
------------------

Initial release.
