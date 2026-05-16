// ==UserScript==
// @name         Torn OC Role Restrictions (with API data)
// @namespace    https://xentac.github.io
// @version      0.9.4
// @description  Highlight role restrictions and best roles in OC 2.0 using both hardcoded data and dynamic API data from tornprobability.com
// @author       underko[3362751], xentac[3354782], MrChurch[3654415]
// @match        https://www.torn.com/factions.php*
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @connect      tornprobability.com
// @license      MIT
// ==/UserScript==

(function () {
  "use strict";

  const DEBUG = true;
  const CONFIG = {
    endpoints: {
      weights: "https://tornprobability.com:3000/api/GetRoleWeights",
      scenarios: "https://tornprobability.com:3000/api/GetSupportedScenarios",
      names: "https://tornprobability.com:3000/api/GetRoleNames",
    },
    colors: {
      high: "#ca6f1e", // Orange-ish
      mid: "#239b56", // Green
      low: "#a93226", // Red
    },
  };

  let ocRoleInfluence = {
    "Pet Project": [
      { role: "Kidnapper", lower: 70 },
      { role: "Muscle", lower: 70 },
      { role: "Picklock", lower: 70 },
    ],
    "Mob Mentality": [
      { role: "Looter #1", lower: 70 },
      { role: "Looter #2", lower: 70 },
      { role: "Looter #3", lower: 60 },
      { role: "Looter #4", lower: 67 },
    ],
    "Cash Me if You Can": [
      { role: "Thief #1", lower: 70 },
      { role: "Thief #2", lower: 65 },
      { role: "Lookout", lower: 70 },
    ],
    "Best of the Lot": [
      { role: "Picklock", lower: 70 },
      { role: "Car Thief", lower: 70 },
      { role: "Muscle", lower: 75 },
      { role: "Imitator", lower: 60 },
    ],
    "Market Forces": [
      { role: "Enforcer", lower: 70 },
      { role: "Negotiator", lower: 70 },
      { role: "Lookout", lower: 68 },
      { role: "Arsonist", lower: 40 },
      { role: "Muscle", lower: 70 },
    ],
    "Smoke and Wing Mirrors": [
      { role: "Car Thief", lower: 74 },
      { role: "Imitator", lower: 70 },
      { role: "Hustler #1", lower: 60 },
      { role: "Hustler #2", lower: 65 },
    ],
    "Gaslight the Way": [
      { role: "Imitator #1", lower: 70 },
      { role: "Imitator #2", lower: 72 },
      { role: "Imitator #3", lower: 72 },
      { role: "Looter #1", lower: 60 },
      { role: "Looter #2", lower: 40 },
      { role: "Looter #3", lower: 65 },
    ],
    "Stage Fright": [
      { role: "Enforcer", lower: 70 },
      { role: "Muscle #1", lower: 72 },
      { role: "Muscle #2", lower: 50 },
      { role: "Muscle #3", lower: 70 },
      { role: "Lookout", lower: 60 },
      { role: "Sniper", lower: 75 },
    ],
    "Snow Blind": [
      { role: "Hustler", lower: 74 },
      { role: "Imitator", lower: 70 },
      { role: "Muscle #1", lower: 70 },
      { role: "Muscle #2", lower: 50 },
    ],
    "Leave No Trace": [
      { role: "Techie", lower: 60 },
      { role: "Negotiator", lower: 70 },
      { role: "Imitator", lower: 73 },
    ],
    "No Reserve": [
      { role: "Car Thief", lower: 67 },
      { role: "Techie", lower: 75 },
      { role: "Engineer", lower: 67 },
    ],
    "Counter Offer": [
      { role: "Robber", lower: 62 },
      { role: "Looter", lower: 42 },
      { role: "Hacker", lower: 60 },
      { role: "Picklock", lower: 60 },
      { role: "Engineer", lower: 62 },
    ],
    "Guardian Ángels": [
      { role: "Enforcer", lower: 60 },
      { role: "Hustler", lower: 73 },
      { role: "Engineer", lower: 70 },
    ],
    "Honey Trap": [
      { role: "Enforcer", lower: 60 },
      { role: "Muscle #1", lower: 70 },
      { role: "Muscle #2", lower: 75 },
    ],
    "Bidding War": [
      { role: "Robber #1", lower: 60 },
      { role: "Driver", lower: 70 },
      { role: "Robber #2", lower: 75 },
      { role: "Robber #3", lower: 70 },
      { role: "Bomber #1", lower: 70 },
      { role: "Bomber #2", lower: 63 },
    ],
    "Blast from the Past": [
      { role: "Picklock #1", lower: 70 },
      { role: "Hacker", lower: 65 },
      { role: "Engineer", lower: 75 },
      { role: "Bomber", lower: 70 },
      { role: "Muscle", lower: 75 },
      { role: "Picklock #2", lower: 40 },
    ],
    "Break the Bank": [
      { role: "Robber", lower: 63 },
      { role: "Muscle #1", lower: 63 },
      { role: "Muscle #2", lower: 60 },
      { role: "Thief #1", lower: 60 },
      { role: "Muscle #3", lower: 72 },
      { role: "Thief #2", lower: 72 },
    ],
    "Stacking the Deck": [
      { role: "Cat Burglar", lower: 75 },
      { role: "Driver", lower: 68 },
      { role: "Hacker", lower: 63 },
      { role: "Imitator", lower: 70 },
    ],
    "Clinical Precision": [
      { role: "Imitator", lower: 75 },
      { role: "Cat Burglar", lower: 70 },
      { role: "Assassin", lower: 60 },
      { role: "Cleaner", lower: 70 },
    ],
    "Ace in the Hole": [
      { role: "Imitator", lower: 65 },
      { role: "Muscle #1", lower: 65 },
      { role: "Muscle #2", lower: 72 },
      { role: "Hacker", lower: 75 },
      { role: "Driver", lower: 60 },
    ],
    "Sneaky Git Grab": [
      { role: "Imitator", lower: 60 },
      { role: "Pickpocket", lower: 75 },
      { role: "Hacker", lower: 66 },
      { role: "Techie", lower: 70 },
    ],
  };

  let ocWeights = {};
  let supportedScenarios = [];
  let apiRoleNames = {};

  const normalizeKey = (str) =>
    str ? str.replace(/[\s#]/g, "").toLowerCase() : "";

  function getLowerFromWeight(weight, roleCount = 3) {
    let val;
    if (weight < 15) val = 45 + weight * 1.13;
    else if (weight < 35) val = 62 + (weight - 15) * 0.6;
    else val = 74 + (weight - 35) * 0.2;

    if (roleCount === 4) val += 2;
    else if (roleCount >= 5) val += 4;
    return Math.round(Math.min(val, 85));
  }

  function classifyOcRoleInfluence(ocName, roleName, roleCount = 3) {
    const cleanOcName = normalizeKey(ocName);
    const cleanRoleName = normalizeKey(roleName);
    let weight = undefined;

    const apiOcKey = Object.keys(ocWeights).find(
      (key) => normalizeKey(key) === cleanOcName,
    );
    if (apiOcKey) {
      const scenarioRoles = ocWeights[apiOcKey];
      const apiRoleKey = Object.keys(scenarioRoles).find(
        (key) => normalizeKey(key) === cleanRoleName,
      );
      if (apiRoleKey) weight = scenarioRoles[apiRoleKey];
    }

    if (weight !== undefined) {
      const lower = getLowerFromWeight(weight, roleCount);
      return { lower, upper: lower + 10 };
    }

    const ocInfo = ocRoleInfluence[ocName];
    const roleData = ocInfo?.find((r) => r.role === roleName);
    const lower = roleData ? roleData.lower : 70;

    let upper = lower + 10;
    if (ocInfo) {
      const roleLowers = ocInfo.map((role) => role.lower).sort((a, b) => a - b);
      if (roleLowers[0] === lower && roleLowers[1]) {
        upper = Math.max(upper, roleLowers[1]);
      }
    }
    return { lower, upper };
  }

  function processCrime(wrapper) {
    const ocId = wrapper.getAttribute("data-oc-id");
    if (!ocId) return;

    const titleEl = wrapper.querySelector('p[class*="panelTitle__"]');
    if (!titleEl) return;

    const crimeTitle = titleEl.textContent.trim();
    const cleanTitle = normalizeKey(crimeTitle);

    if (DEBUG) console.log(`[OC] Checking crime: ${crimeTitle}`);

    if (supportedScenarios.length > 0) {
      const isSupported = supportedScenarios.some(
        (s) => normalizeKey(s.name) === cleanTitle,
      );
      if (!isSupported) {
        if (DEBUG)
          console.log(
            `[OC] Crime ${crimeTitle} is not in the supported API list. Skipping.`,
          );
        return;
      }
    }

    const roleEls = wrapper.querySelectorAll('[class*="title__"]');
    const totalRolesInCrime = roleEls.length;

    roleEls.forEach((roleEl) => {
      const roleName = roleEl.textContent.trim();

      // Ignore elements that look like timers (contain colons)
      if (roleName.includes(":")) {
        return;
      }

      const successEl = roleEl.nextElementSibling;
      if (!successEl || !/\d+/.test(successEl.textContent)) {
        return;
      }

      if (Object.keys(apiRoleNames).length > 0) {
        const apiOcKey = Object.keys(apiRoleNames).find(
          (key) => normalizeKey(key) === cleanTitle,
        );
        if (apiOcKey) {
          const normalizedKnownRoles = Object.values(
            apiRoleNames[apiOcKey],
          ).map((r) => normalizeKey(r));
          if (!normalizedKnownRoles.includes(normalizeKey(roleName))) {
            if (DEBUG)
              console.log(
                `[OC] Role ${roleName} not found in API for ${crimeTitle}. Skipping.`,
              );
            return;
          }
        }
      }

      const chance = parseInt(successEl.textContent.trim(), 10);
      if (isNaN(chance)) return;

      const { lower, upper } = classifyOcRoleInfluence(
        crimeTitle,
        roleName,
        totalRolesInCrime,
      );

      if (DEBUG)
        console.log(
          `[OC] ${crimeTitle} - ${roleName}: Chance ${chance}, Range ${lower}-${upper}`,
        );

      const newText = `${chance}/${lower}`;
      if (successEl.textContent !== newText) {
        successEl.textContent = newText;
      }

      const slotHeader = roleEl.closest('button[class*="slotHeader__"]');
      if (slotHeader) {
        let color = CONFIG.colors.low;
        if (chance >= upper) color = CONFIG.colors.high;
        else if (chance >= lower) color = CONFIG.colors.mid;

        if (slotHeader.style.backgroundColor !== color) {
          slotHeader.style.backgroundColor = color;
        }
      }
    });
  }

  async function fetchApiData() {
    const request = (url) =>
      new Promise((resolve) => {
        GM_xmlhttpRequest({
          method: "GET",
          url: url,
          onload: (res) =>
            resolve(res.status === 200 ? JSON.parse(res.responseText) : null),
          onerror: () => resolve(null),
        });
      });

    const [weights, scenarios, names] = await Promise.all([
      request(CONFIG.endpoints.weights),
      request(CONFIG.endpoints.scenarios),
      request(CONFIG.endpoints.names),
    ]);

    if (weights) ocWeights = weights;
    if (scenarios) supportedScenarios = scenarios;
    if (names) apiRoleNames = names;
  }

  function getFactionId() {
    const urlParams = new URLSearchParams(window.location.search);
    // Torn sometimes puts faction IDs in the hash or query.
    // This is a safer way to parse parameters from the current URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    return urlParams.get("a") || hashParams.get("a") || "";
  }

  function updateFactionRoleRestrictions(factionId) {
    return new Promise((resolve) => {
      GM_xmlhttpRequest({
        method: "GET",
        url: `https://raw.githubusercontent.com/xentac/oc_role_restrictions/refs/heads/main/${factionId}.json`,
        onload: (res) => {
          if (res.status === 200) {
            try {
              ocRoleInfluence = JSON.parse(res.responseText);
            } catch (e) {}
          }
          resolve();
        },
        onerror: resolve,
      });
    });
  }

  function setupMutationObserver(root) {
    const observer = new MutationObserver(() => {
      const activeTab = document
        .querySelector('button[class*="active__"] span[class*="tabName__"]')
        ?.textContent.trim();
      if (activeTab !== "Recruiting" && activeTab !== "Planning") return;

      const allCrimes = root.querySelectorAll(
        '[class*="wrapper__"][data-oc-id]',
      );
      allCrimes.forEach(processCrime);
    });
    observer.observe(root, { childList: true, subtree: true });
  }

  async function init() {
    if (DEBUG) console.log("[OC] Script initializing...");

    await fetchApiData();
    if (DEBUG) console.log("[OC] API Data fetched.");

    const factionId = getFactionId();
    if (factionId) {
      if (DEBUG)
        console.log(
          `[OC] Found Faction ID: ${factionId}, fetching custom JSON...`,
        );
      await updateFactionRoleRestrictions(factionId);
    } else {
      if (DEBUG)
        console.log("[OC] No Faction ID found, using internal defaults.");
    }

    waitForKeyElements("#faction-crimes-root", (root) => {
      if (DEBUG)
        console.log("[OC] #faction-crimes-root found. Setting up observer.");
      setupMutationObserver(root);
      root
        .querySelectorAll('[class*="wrapper__"][data-oc-id]')
        .forEach(processCrime);
    });
  }

  init();

  function waitForKeyElements(selector, callback) {
    const interval = setInterval(() => {
      const el = document.querySelector(selector);
      if (el) {
        clearInterval(interval);
        callback(el);
      }
    }, 300);
  }
})();
