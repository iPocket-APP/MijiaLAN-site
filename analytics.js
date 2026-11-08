(() => {
  const measurementId = "G-PS823ESX5Q";
  const panel = document.querySelector("#analytics-consent");
  const settings = document.querySelector("[data-analytics-settings]");
  if (
    !panel ||
    !settings ||
    location.origin !== "https://mijialan.ipocket.xyz" ||
    !/^G-[A-Z0-9]+$/.test(measurementId)
  ) {
    return;
  }

  const preferenceKey = "mijialan-analytics-consent-v1";
  const disableKey = `ga-disable-${measurementId}`;
  const denied = {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  };
  const granted = { ...denied, analytics_storage: "granted" };
  const bannerCountries = new Set(
    "AT BE BG CH CY CZ DE DK EE ES FI FR GB GR HR HU IE IS IT LI LT LU LV MT NL NO PL PT RO SE SI SK".split(
      " ",
    ),
  );
  // The Cloudflare country code cannot distinguish Quebec from the rest of Canada.
  const manualCountries = new Set(["CA", "CN"]);
  let tagRequested = false;
  let automatic = false;

  function readChoice() {
    try {
      const saved = localStorage.getItem(preferenceKey);
      return saved === "allow" || saved === "deny" ? saved : null;
    } catch {
      return null;
    }
  }
  let choice = readChoice();

  function applyChoice() {
    const allowed = choice === "allow" || (choice === null && automatic);
    window[disableKey] = !allowed;

    if (!allowed) {
      if (tagRequested) window.gtag("consent", "update", denied);
      for (const cookie of document.cookie.split(";")) {
        const name = cookie.trim().split("=", 1)[0];
        if (/^mijialan_ga(?:_|$)/.test(name)) {
          document.cookie = `${name}=; Max-Age=0; Path=/; Secure; SameSite=Lax`;
        }
      }
      return;
    }

    if (tagRequested) {
      window.gtag("consent", "update", granted);
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("consent", "default", choice === "allow" ? denied : granted);
    if (choice === "allow") window.gtag("consent", "update", granted);
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      cookie_domain: "none",
      cookie_prefix: "mijialan",
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });

    const tag = document.createElement("script");
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    tagRequested = true;
    document.head.append(tag);
  }

  function setPanelOpen(open, banner = false) {
    const wasBanner = panel.classList.contains("analytics-banner");
    panel.hidden = !open;
    panel.classList.toggle("analytics-banner", open && banner);
    settings.setAttribute("aria-expanded", String(open));
    if (open && (!banner || document.activeElement === document.body)) {
      panel.focus({ preventScroll: banner });
    } else if (!open && !wasBanner) {
      settings.focus();
    }
  }

  async function getVisitorCountry() {
    try {
      const response = await fetch("https://tools.ipocket.xyz/cdn-cgi/trace", {
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer",
        signal: AbortSignal.timeout(2500),
      });
      if (!response.ok) return null;
      const country = (await response.text()).match(/^loc=([A-Z]{2})\r?$/m)?.[1];
      return country && country !== "XX" && country !== "ZZ" ? country : null;
    } catch {
      return null;
    }
  }

  async function applyRegionalDefault() {
    const country = await getVisitorCountry();
    if (!country) return;

    const needsBanner = bannerCountries.has(country);
    automatic = !needsBanner && !manualCountries.has(country);
    applyChoice();
    if (needsBanner && choice === null && panel.hidden) setPanelOpen(true, true);
  }

  function syncSavedChoice() {
    choice = readChoice();
    applyChoice();
    if (choice !== null && panel.classList.contains("analytics-banner")) setPanelOpen(false);
  }

  settings.hidden = false;
  settings.addEventListener("click", () =>
    setPanelOpen(panel.hidden || panel.classList.contains("analytics-banner")),
  );
  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setPanelOpen(false);
  });
  for (const button of panel.querySelectorAll("[data-analytics-choice]")) {
    button.addEventListener("click", () => {
      choice = button.dataset.analyticsChoice;
      try {
        localStorage.setItem(preferenceKey, choice);
      } catch {
        // The choice still applies to the current page if browser storage is unavailable.
      }
      applyChoice();
      setPanelOpen(false);
    });
  }
  window.addEventListener("storage", (event) => {
    if (event.key === preferenceKey || event.key === null) {
      syncSavedChoice();
    }
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) syncSavedChoice();
  });

  for (const link of document.querySelectorAll("[data-download-placement]")) {
    link.addEventListener("click", () => {
      if (!tagRequested || window[disableKey] || link.origin !== "https://github.com") return;
      window.gtag("event", "download_click", {
        send_to: measurementId,
        app_slug: "mijialan",
        platform: link.dataset.downloadPlatform || "macos",
        store: "github",
        locale: document.documentElement.lang,
        placement: link.dataset.downloadPlacement,
        link_url: link.origin + link.pathname,
      });
    });
  }

  if (choice === null) {
    window[disableKey] = true;
    if (settings.dataset.analyticsSettings === "regional") void applyRegionalDefault();
  } else {
    applyChoice();
  }
})();
