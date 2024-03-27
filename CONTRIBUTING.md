# CONTRIBUTING.md

## a fantastic way to build your resume

xibbit has several unique attributes that make your xibbit code contributions a faster and better way to build your resume than other open source projects or a portfolio project. They are:

1. **get experience on your resume with the languages, frameworks and technologies that you choose** As of this writing, xibbit supports React with Redux, Flutter, AngularJS, Marko, Mithril, Inferno, Go, Node.js, PHP and MySQL.  *But Angular, Python Django, Vue.js, Ember.js, Rust, Swift, Kotlin, Java Akka, Clojure, svelte.js, Laravel, Ruby on Rails, MongoDB and anything else the piques your interest is available.*  Interested in AI?  Add an AI feature to one or all of the examples.  Interested in React, even though it's been done?  Refactor the React examples, fix bugs or flesh out React tests.  Put an **@author** tag on every class or function that you touch.  Contact us if you want us to link to your project that uses xibbit.
1. **focus on the tech, don't hassle with the features or the logic** Supercharge your contributions by having multiple reference xibbit implementations that you can port line-by-line.  Whether it's client-side or server-side, use xibbit to focus on learning the language, framework or technology instead of deciding on features or fiddling with logic.
1. **learn quickly and add it to your resume** porting a xibbit client or xibbit server to a new technology is a matter of weeks instead of months of deciding on features, designing an application (even a portfolio application) and then implementing and debugging the code.

Don't waste your time on a portfolio site for your resume.  Contributing to xibbit is faster and focused on learning what *you* want to learn and putting that on your resume or LinkedIn profile.

Imagine your new resume:

**Objective**

Swift iOS app developer position.

**Skills**

Swift         | etc.
------------- | ---------------
etc.          | etc.

**Open Source**

Implemented entire xibbit open source framework in Swift, including Public Figure example iOS app which included account creation, logging in, displaying/editing user data and logging out.  See it at http://github.com/yourname/xibbit or http://www.yourname.com/publicfigure.

**Work Experience**

etc.

## implementing a new xibbit client (easier)

1. Fork xibbit on GitHub.
1. Do `git clone https://github.com/yourname/xibbit.git` to get your fork.
1. Create a new folder like "www/xibbit/client/vue".
1. Install the new client language/framework (e.g. Vue.js).
1. Get a build and an example running in your new client language/framework.
1. Copy the AngularJS or React source code into the appropriate place in your client folder.
1. Comment out the xibbit references and convert the rest of the app to your language/framework.  Don't worry about client/server communicate now, just hardcode the server response.
1. If it's a JavaScript based client framework, just copy the socket.io.js file and tweak it to work.
1. If it's not a JavaScript-based client framework, find a Socket.IO client implementation in that client framework or port the JavaScript one.  (Porting sounds hard but it's not as bad as it sounds.  Socket.IO clients aren't that big.  Use the Flutter Socket.IO port for reference.)
1. Uncomment xibbit client references and xibbit client source code (xibbit.js).
1. If it's a JavaScript-based client framework, tweak xibbit.js until it works.
1. If it's not a JavaScript-based client framework, port xibbit.js to the client language, using Flutter xibbit.dart for reference.
1. Replace the hardcodes with xibbit API calls which you commented out earlier.
1. Keep porting until the entire Public Figure sample client is running in the new client language/framework.
1. You're done!

## implementing a new xibbit server (not as easy)

1. Fork xibbit on GitHub.
1. Do `git clone https://github.com/yourname/xibbit.git` to get your fork.
1. Install the new server language/framework (e.g. Python, Django).
1. Create a new folder like "www/xibbit/server/python" or "www/xibbit/server/python/django".
1. Implement a simple app to read and write to a MySQL database using the new server language/framework.
1. Copy the xibdb.php code and port it to the new server language/framework.  For xibdb, the PHP version is the simplest to understand and usually the closest to your target language.
1. Create a simple app to exercise the xibdb port to confirm that it works.
1. Install Socket.IO for the server language/framework.
1. Create a simple app (both client and server) to confirm that Socket.IO works.  Usually, in the process of making this work, you will also install an http server and be able to serve static files and handle REST requests locally.
1. Copy "www/xibbit/server/golang/src/xibbit/xibbit.go" and port some of it to the new server language/framework.  For xibbit itself, the Golang version is the simples to port because it does not have any of the extra Socket.IO emulation code of PHP and does not have the asynchronous callback of JavaScript and Node.js.  In some cases, it may be helpful to augment the Golang version by looking at the PHP version.
1. Copy "www/xibbit/server/golang/src/publicfigure/events" and port these files as needed.
1. Keep porting until the entire Public Figure sample app is running in the new server language/framework.
1. You're done!

## submit a PR (pull request) to xibbit

Pull requests can be made using the "Compare" button your GitHub fork.

Please have 2 commits (instead of 1):

The first commit should show the default app generated by the new language, framework or technology that you are implementing.  This will help developers know how the new language, framework or technology looks "out of the box".

The second comment (or possibly third or fourth) should show the changes that you have made to default app in order to implement your xibbit client or your xibbit server.  Feel free to use as many commits as you want during implementation but please do a ```git rebase``` to squash it down into 2 commits if possible (and 3 or 4 if that makes it clearer).

## other changes

xibbit is open to bug fixes that cut across all languages, frameworks and technologies.  Feel free to submit a PR for relatively small fixes.

xibbit is open to API and design changes that cut across all languages, frameworks and technologies but please consult with us.  Due to all languages, frameworks and technologies supported by xibbit, it is a big job.

Of course, you may create your own changes to your own fork and host and promote your own variant of xibbit, if you wish.
