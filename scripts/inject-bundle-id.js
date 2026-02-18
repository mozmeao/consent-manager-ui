#!/usr/bin/env node

/**
 * Generates index.html with the BUNDLE_ID from .env injected.
 *
 * Usage:
 *   node scripts/inject-bundle-id.js                          # local mode (all assets from localhost)
 *   node scripts/inject-bundle-id.js --cm-test                # cm-test mode (all assets from CDN)
 *   node scripts/inject-bundle-id.js --cm                     # production mode (all assets from CDN)
 *
 * Granular overrides (combine with --cm-test or --cm):
 *   --local-ui        Load ui.js from localhost instead of CDN
 *   --local-css       Load cm.css from localhost instead of CDN
 *   --local-messages  Load translations from localhost instead of CDN
 *
 * Examples:
 *   node scripts/inject-bundle-id.js --cm-test --local-css    # CDN UI + local CSS
 *   node scripts/inject-bundle-id.js --cm --local-ui          # prod CDN config + local UI
 *   node scripts/inject-bundle-id.js --cm-test --local-ui --local-css --local-messages  # CDN config + all local assets
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const root = path.resolve(__dirname, '..');
const mode = args.includes('--cm')
  ? 'cm'
  : args.includes('--cm-test')
    ? 'cm-test'
    : 'local';

// In local mode, all assets are local by default.
// In cm-test/cm modes, assets come from CDN unless explicitly overridden.
const useLocalUi = mode === 'local' || args.includes('--local-ui');
const useLocalCss = mode === 'local' || args.includes('--local-css');
const useLocalMessages = mode === 'local' || args.includes('--local-messages');

// Load .env file if it exists
const envPath = path.join(root, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
}

const BUNDLE_ID = process.env.BUNDLE_ID;
if (!BUNDLE_ID) {
  console.warn('BUNDLE_ID not set — skipping index.html generation.');
  process.exit(0);
}
if (!/^[a-f0-9-]+$/i.test(BUNDLE_ID)) {
  console.error(`Invalid BUNDLE_ID: must be a hex/UUID string, got "${BUNDLE_ID}"`);
  process.exit(1);
}

const cdnPath = mode === 'cm' ? 'cm' : 'cm-test';

// Build data-* attributes for local overrides
const localAttrs = [
  useLocalUi ? '      data-ui="http://localhost:8080/ui.js"' : '',
  useLocalMessages ? '      data-messages="http://localhost:8080/translations"' : '',
  useLocalCss ? '      data-css="http://localhost:8080/cm.css"' : '',
].filter(Boolean);
const localAttrsStr = localAttrs.length > 0 ? '\n' + localAttrs.join('\n') : '';

const html = `<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
  <head>
    <title>Transcend Consent Manager Playground</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style type="text/css">
      body {
        display: grid;
        place-items: center;
        height: 100vh;
      }

      #load-options ul,
      #presets ul {
        list-style: none;
        padding-left: 0;
        margin-top: 0;
      }

      #load-options label {
        padding-left: 4px;
      }

      #policy-content img {
        max-width: 100%;
        height: auto;
      }

      img:not([src]):not([srcset])::after,
    img[src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"]::after
      {
        content: '[image blocked]';
        color: crimson;
        font-weight: bold;
      }

      :not(img):-moz-broken::after {
        content: '[resource blocked]';
        color: crimson;
        font-weight: bold;
      }

      .innerHtmlTest {
        color: red;
      }
    </style>
    <script
      data-cfasync="false"${localAttrsStr}
      data-secondary-policy="http://transcend.io/test"
      src="https://cdn.transcend.io/${cdnPath}/${BUNDLE_ID}/airgap.js"
      onload="window.airgapScriptLoadEvent=event;"
      data-regime="GDPR"
    ></script>
  </head>

  <body style="height: 100%">
    <h1>Transcend Consent Manager Playground!</h1>

    <button id="cpra_button" style="display: none">
      <img src="./privacy-choices-icon.svg" />
      <span>Your Privacy Choices</span>
    </button>

    <script>
      if (airgap && airgap.getRegimes().has('CPRA')) {
        var cpraButton = document.getElementById('cpra_button');
        cpraButton.onclick = function () {
          transcend.showConsentManager({ viewState: 'AcceptOrRejectAll' });
        };

        cpraButton.style.display = 'block';
      }
    </script>

    <h2>Do Not Sell/Share</h2>
    <br />
    <button id="do-not-sell">Do Not Sell My Personal Information</button>
    <button id="opt-out-all">Opt Out of All Purposes</button>
    <button id="do-not-sell-reset">Reset</button>
    <hr />
    <h2>View States</h2>
    <p id="data"></p>
    <h2>Policy Content</h2>
    <div style="max-width: 600px">
      <div id="policy-content" style="max-width: 100%"></div>
    </div>
    <br />
    <script>
      var handleDoNotSell = (event) => {
        transcend.doNotSell(event);
      };
      var handleOptOutOfAll = (event) => {
        transcend.optOutNotice(event);
      };
      var resetDoNotSell = (event) => {
        airgap.setConsent(
          event,
          { SaleOfInfo: true },
          { confirmed: false, prompted: false },
        );
        setupDoNotSellButton();
      };

      // Setup do not sell
      var setupDoNotSellButton = () => {
        // get button elements
        let doNotSellDoc = document.getElementById('do-not-sell');
        let optOutDoc = document.getElementById('opt-out-all');
        let doNotSellDocReset = document.getElementById('do-not-sell-reset');

        // handle opt out of all
        optOutDoc.addEventListener('click', handleOptOutOfAll);

        // reset state
        doNotSellDocReset.addEventListener('click', resetDoNotSell);

        // check if opted in or out of sale
        let isOptedOut = !airgap.getConsent().purposes.SaleOfInfo;

        // change text if opted out
        if (isOptedOut) {
          doNotSellDoc.innerHTML =
            'We No Longer Sell Your Personal Information';
          doNotSellDoc.removeEventListener('click', handleDoNotSell);
        } else {
          doNotSellDoc.innerHTML = 'Do Not Sell My Personal Information';

          // Add on click event if user is opted in
          doNotSellDoc.addEventListener('click', handleDoNotSell);
        }
      };

      // Setup buttons for each view state
      let doc = document.getElementById('data');

      // callback on change of view state
      var setViewState = (viewState) => {
        transcend.showConsentManager(viewState);
        setupDoNotSellButton();
      };

      // Add button for default view state
      doc.innerHTML += \`<button onClick="transcend.showConsentManager()">Default</button><br/><br/>\`;

      // callback on change of view state
      var fetchBackendConsent = (userId) => {
        console.log(\`Mocking call to backend to fetch user ID \${userId}\`);
        return Promise.resolve({
          SaleOfInfo: false,
        });
      };

      /**
       * Dynamically change out policy content based on language
       */
      async function setPolicyContent(language) {
        if (language) {
          await transcend.setActiveLocale(language);
        }
        const [policy] = await transcend.getPolicies({
          policyTitles: ['Label Privacy Policy'],
          locale: language || transcend.getActiveLocale(),
        });
        document.getElementById('policy-content').innerHTML = policy.content;
      }

      // Prepare document on ready
      transcend.ready(() => {
        // Add buttons for view states
        transcend.viewStates.forEach((viewState) => {
          doc.innerHTML += \`<button onClick="setViewState({ viewState: '\${viewState}' })">\${viewState}</button><br/><br/>\`;
        });

        // re-render the button on consent change
        airgap.addEventListener('consent-change', (...args) => {
          setupDoNotSellButton();
        });

        // setup the do not sell button
        setupDoNotSellButton();

        transcend
          .setUiVariables({
            labelName: 'Marshmalt Records',
          })
          .then(() => {
            setPolicyContent();
          });
      });
    </script>
  </body>
</html>
`;

const dest = path.join(root, 'dist', 'index.html');

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(dest, html, 'utf8');

const localOverrides = [
  useLocalUi && 'ui',
  useLocalCss && 'css',
  useLocalMessages && 'messages',
].filter(Boolean);
const overrideInfo = localOverrides.length > 0
  ? ` | local: ${localOverrides.join(', ')}`
  : ' | all CDN';
console.log(`Generated index.html (${mode} mode${overrideInfo}) with BUNDLE_ID=${BUNDLE_ID}`);
