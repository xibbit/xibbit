"npm run build" is a bit flaky.

Remove the .cache folder before running "npm run build", especially if it fails:

$ rm -rf .cache

You may also need to adjust the following timeouts:

"LASSO_TIMEOUT=35001" in package.json

"bundleReadTimeout: 10002," in project.js

Successful builds have ordinary files with cache-busting names in the dist/ folder, e.g.:

hello-18e5ec9c.js
hello-294de849.css
logo-889df60b.png

Failed builds have only one ordinary file in the dist/ folder:

index.html
