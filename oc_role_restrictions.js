// ==UserScript==
// @name         Torn OC Role Restrictions
// @namespace    https://xentac.github.io
// @version      0.8
// @description  Highlight role restrictions and best roles in OC 2.0 (modified copy of "Torn OC Role Evaluator"). Well paired with https://greasyfork.org/en/scripts/526834-oc-success-chance-2-0.
// @author       underko[3362751], xentac[3354782], MrChurch[3654415]
// @match        https://www.torn.com/factions.php*
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @connect      tornprobability.com
// @license      MIT
// ==/UserScript==

(function () {
    "use strict";

    const DEBUG = false;

    console.log("[OCRoleRestrictions] Script initialized.");

    // fallback data defaults for when API is unavailable or for custom faction overrides
    let ocRoleInfluence = {
        "Pet Project": [{ role: "Kidnapper", lower: 70 }, { role: "Muscle", lower: 70 }, { role: "Picklock", lower: 70 }],
        "Mob Mentality": [{ role: "Looter #1", lower: 70 }, { role: "Looter #2", lower: 70 }, { role: "Looter #3", lower: 60 }, { role: "Looter #4", lower: 67 }],
        "Cash Me if You Can": [{ role: "Thief #1", lower: 70 }, { role: "Thief #2", lower: 65 }, { role: "Lookout", lower: 70 }],
        "Best of the Lot": [{ role: "Picklock", lower: 70 }, { role: "Car Thief", lower: 70 }, { role: "Muscle", lower: 75 }, { role: "Imitator", lower: 60 }],
        "Market Forces": [{ role: "Enforcer", lower: 70 }, { role: "Negotiator", lower: 70 }, { role: "Lookout", lower: 68 }, { role: "Arsonist", lower: 40 }, { role: "Muscle", lower: 70 }],
        "Smoke and Wing Mirrors": [{ role: "Car Thief", lower: 74 }, { role: "Imitator", lower: 70 }, { role: "Hustler #1", lower: 60 }, { role: "Hustler #2", lower: 65 }],
        "Gaslight the Way": [{ role: "Imitator #1", lower: 70 }, { role: "Imitator #2", lower: 72 }, { role: "Imitator #3", lower: 72 }, { role: "Looter #1", lower: 60 }, { role: "Looter #2", lower: 40 }, { role: "Looter #3", lower: 65 }],
        "Stage Fright": [{ role: "Enforcer", lower: 70 }, { role: "Muscle #1", lower: 72 }, { role: "Muscle #2", lower: 50 }, { role: "Muscle #3", lower: 70 }, { role: "Lookout", lower: 60 }, { role: "Sniper", lower: 75 }],
        "Snow Blind": [{ role: "Hustler", lower: 74 }, { role: "Imitator", lower: 70 }, { role: "Muscle #1", lower: 70 }, { role: "Muscle #2", lower: 50 }],
        "Leave No Trace": [{ role: "Techie", lower: 60 }, { role: "Negotiator", lower: 70 }, { role: "Imitator", lower: 73 }],
        "No Reserve": [{ role: "Car Thief", lower: 67 }, { role: "Techie", lower: 75 }, { role: "Engineer", lower: 67 }],
        "Counter Offer": [{ role: "Robber", lower: 62 }, { role: "Looter", lower: 42 }, { role: "Hacker", lower: 60 }, { role: "Picklock", lower: 60 }, { role: "Engineer", lower: 62 }],
        "Guardian Ángels": [{ role: "Enforcer", lower: 60 }, { role: "Hustler", lower: 73 }, { role: "Engineer", lower: 70 }],
        "Honey Trap": [{ role: "Enforcer", lower: 60 }, { role: "Muscle #1", lower: 70 }, { role: "Muscle #2", lower: 75 }],
        "Bidding War": [{ role: "Robber #1", lower: 60 }, { role: "Driver", lower: 70 }, { role: "Robber #2", lower: 75 }, { role: "Robber #3", lower: 70 }, { role: "Bomber #1", lower: 70 }, { role: "Bomber #2", lower: 63 }],
        "Blast from the Past": [{ role: "Picklock #1", lower: 70 }, { role: "Hacker", lower: 65 }, { role: "Engineer", lower: 75 }, { role: "Bomber", lower: 70 }, { role: "Muscle", lower: 75 }, { role: "Picklock #2", lower: 40 }],
        "Break the Bank": [{ role: "Robber", lower: 63 }, { role: "Muscle #1", lower: 63 }, { role: "Muscle #2", lower: 60 }, { role: "Thief #1", lower: 60 }, { role: "Muscle #3", lower: 72 }, { role: "Thief #2", lower: 72 }],
        "Stacking the Deck": [{ role: "Cat Burglar", lower: 75 }, { role: "Driver", lower: 68 }, { role: "Hacker", lower: 63 }, { role: "Imitator", lower: 70 }],
        "Clinical Precision": [{ role: "Imitator", lower: 75 }, { role: "Cat Burglar", lower: 70 }, { role: "Assassin", lower: 60 }, { role: "Cleaner", lower: 70 }],
        "Ace in the Hole": [{ role: "Imitator", lower: 65 }, { role: "Muscle #1", lower: 65 }, { role: "Muscle #2", lower: 72 }, { role: "Hacker", lower: 75 }, { role: "Driver", lower: 60 }],
        "Sneaky Git Grab": [{ role: "Imitator", lower: 60 }, { role: "Pickpocket", lower: 75 }, { role: "Hacker", lower: 66 }, { role: "Techie", lower: 70 }],
    };

    let crimeData = {};
    let previousTab = "none";
    let ocWeights = {};
    let supportedScenarios = [];
    let apiRoleNames = {};

    function normalizeKey(str) {
        return str.replace(/[\s#]/g, '').toLowerCase();
    }

    // fixes outliers by using a curve and scaling based on role count
    function getLowerFromWeight(weight, roleCount = 3) {
        let val;

        // smooth "logistic-style" curve
        if (weight < 15) {
            val = 45 + (weight * 1.13); // range 0-15 targets 45% to 62%
        } else if (weight < 35) {
            val = 62 + ((weight - 15) * 0.6); // range 15-35 targets 62% to 74%
        } else {
            val = 74 + ((weight - 35) * 0.2); // range 35+ soft caps slowly toward 82%
        }

        // adjusts individual requirements to maintain ~75% global success for larger teams
        if (roleCount === 4) {
            val += 2;
        } else if (roleCount >= 5) {
            val += 4;
        }

        return Math.round(Math.min(val, 85));
    }

    function classifyOcRoleInfluence(ocName, roleName, roleCount = 3) {
        const cleanOcName = normalizeKey(ocName);
        const cleanRoleName = normalizeKey(roleName);
        let weight = undefined;

        const apiOcKey = Object.keys(ocWeights).find(key => normalizeKey(key) === cleanOcName);

        if (apiOcKey) {
            const scenarioRoles = ocWeights[apiOcKey];
            const apiRoleKey = Object.keys(scenarioRoles).find(key => normalizeKey(key) === cleanRoleName);

            if (apiRoleKey) {
                weight = scenarioRoles[apiRoleKey];
            }
        }

        if (weight !== undefined) {
            const lower = getLowerFromWeight(weight, roleCount);
            return { lower: lower, upper: lower + 10, source: `API (Balanced)` };
        }

        // fallback to static defaults
        const ocInfo = ocRoleInfluence[ocName];
        const roleData = ocInfo?.find((r) => r.role === roleName);
        const lower = roleData ? roleData.lower : 70;
        return { lower, upper: lower + 10, source: roleData ? "Default Value" : "Fallback Value" };
    }

    function processCrime(wrapper) {
        const ocId = wrapper.getAttribute("data-oc-id");
        if (!ocId || crimeData[ocId]) return;

        const titleEl = wrapper.querySelector("p.panelTitle___aoGuV");
        if (!titleEl) return;

        const crimeTitle = titleEl.textContent.trim();

        if (supportedScenarios.length > 0) {
            const cleanTitle = normalizeKey(crimeTitle);
            const isSupported = supportedScenarios.some(s => normalizeKey(s.name) === cleanTitle);
            if (!isSupported) return;
        }

        const roles = [];
        const roleEls = wrapper.querySelectorAll(".title___UqFNy");
        const totalRolesInCrime = roleEls.length; // capture how many roles are in this OC

        roleEls.forEach((roleEl) => {
            const roleName = roleEl.textContent.trim();

            if (Object.keys(apiRoleNames).length > 0) {
                const cleanTitle = normalizeKey(crimeTitle);
                const apiOcKey = Object.keys(apiRoleNames).find(key => normalizeKey(key) === cleanTitle);
                if (apiOcKey) {
                    const normalizedKnownRoles = Object.values(apiRoleNames[apiOcKey]).map(r => normalizeKey(r));
                    if (!normalizedKnownRoles.includes(normalizeKey(roleName))) return;
                }
            }

            const successEl = roleEl.nextElementSibling;
            const chance = successEl ? parseInt(successEl.textContent.trim(), 10) : null;

            const evaluation = chance !== null
                ? classifyOcRoleInfluence(crimeTitle, roleName, totalRolesInCrime)
                : { lower: 70, upper: 80, source: "None" };

            roles.push({ role: roleName, chance, evaluation });

            if (successEl && evaluation.lower) {
                successEl.textContent = `${chance}/${evaluation.lower}`;
            }

            const slotHeader = roleEl.closest("button.slotHeader___K2BS_");
            if (slotHeader) {
                if (chance >= evaluation.upper) {
                    // optional highlighting for over-qualified
                } else if (chance >= evaluation.lower) {
                    slotHeader.style.backgroundColor = "#239b56"; // Green
                } else {
                    slotHeader.style.backgroundColor = "#a93226"; // Red
                }
            }
        });

        crimeData[ocId] = { id: ocId, title: crimeTitle, roles };
        if (DEBUG) console.log(`[OCRoleRestrictions] Processed: ${crimeTitle} using ${totalRolesInCrime} roles.`);
    }

    function refreshCrimes() {
        const allCrimes = document.querySelectorAll(".wrapper___U2Ap7");
        allCrimes.forEach((crimeNode) => processCrime(crimeNode));
    }

    function fetchRoleWeights() {
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://tornprobability.com:3000/api/GetRoleWeights",
            onload: function (response) {
                if (response.status === 200) {
                    ocWeights = JSON.parse(response.responseText);
                    refreshCrimes();
                }
            }
        });
    }

    function fetchSupportedScenarios() {
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://tornprobability.com:3000/api/GetSupportedScenarios",
            onload: function (response) {
                if (response.status === 200) {
                    supportedScenarios = JSON.parse(response.responseText);
                    refreshCrimes();
                }
            }
        });
    }

    function fetchRoleNames() {
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://tornprobability.com:3000/api/GetRoleNames",
            onload: function (response) {
                if (response.status === 200) {
                    apiRoleNames = JSON.parse(response.responseText);
                    refreshCrimes();
                }
            }
        });
    }

    function getFactionId() {
        let factionId = "";
        try {
            const thread = document.querySelector(".forum-thread");
            if (thread && thread.href) {
                thread.href.split("#")[1].split("&").forEach((elem) => {
                    if (elem.startsWith("a=")) factionId = elem.split("=")[1];
                });
            }
        } catch (e) { console.log("Faction ID search failed."); }
        return factionId;
    }

    function updateFactionRoleRestrictions(factionId, cb) {
        GM_xmlhttpRequest({
            method: "GET",
            url: `https://raw.githubusercontent.com/xentac/oc_role_restrictions/refs/heads/main/${factionId}.json`,
            onload: function (response) {
                if (response.status === 200) {
                    ocRoleInfluence = JSON.parse(response.responseText);
                }
                cb();
            },
            onerror: cb
        });
    }

    function setupMutationObserver(root) {
        const observer = new MutationObserver(() => {
            const tabTitle = document.querySelector("button.active___ImR61 span.tabName___DdwH3")?.textContent.trim();
            if (tabTitle !== "Recruiting" && tabTitle !== "Planning") return;
            if (previousTab !== tabTitle) {
                crimeData = {};
                previousTab = tabTitle;
            }
            refreshCrimes();
        });
        observer.observe(root, { childList: true, subtree: true });
    }

    // init
    fetchRoleWeights();
    fetchSupportedScenarios();
    fetchRoleNames();

    const factionId = getFactionId();
    const startCallback = () => {
        waitForKeyElements("#faction-crimes-root", (root) => setupMutationObserver(root));
    };

    if (factionId) {
        updateFactionRoleRestrictions(factionId, startCallback);
    } else {
        startCallback();
    }

    // waitForKeyElements dependency (CoeJoder fork)
    function waitForKeyElements(selectorOrFunction, callback, waitOnce = true, interval = 300, maxIntervals = -1) {
        var targetNodes = typeof selectorOrFunction === "function" ? selectorOrFunction() : document.querySelectorAll(selectorOrFunction);
        var targetsFound = targetNodes && targetNodes.length > 0;
        if (targetsFound) {
            targetNodes.forEach(function (targetNode) {
                var attrName = 'data-userscript-found';
                if (!targetNode.getAttribute(attrName)) {
                    callback(targetNode);
                    targetNode.setAttribute(attrName, true);
                }
            });
        }
        if (maxIntervals !== 0 && !(targetsFound && waitOnce)) {
            setTimeout(() => waitForKeyElements(selectorOrFunction, callback, waitOnce, interval, maxIntervals - 1), interval);
        }
    }
})();
