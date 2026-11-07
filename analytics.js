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
  let tagRequested = false;

  function readChoice() {
    try {
      return localStorage.getItem(preferenceKey);
    } catch {
      return null;
    }
  }

  function applyChoice(choice) {
    const allowed = choice === "allow";
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
    window.gtag("consent", "default", denied);
    window.gtag("consent", "update", granted);
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

  function setPanelOpen(open) {
    panel.hidden = !open;
    settings.setAttribute("aria-expanded", String(open));
    (open ? panel : settings).focus();
  }

  settings.hidden = false;
  settings.addEventListener("click", () => setPanelOpen(panel.hidden));
  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setPanelOpen(false);
  });
  for (const button of panel.querySelectorAll("[data-analytics-choice]")) {
    button.addEventListener("click", () => {
      const choice = button.dataset.analyticsChoice;
      try {
        localStorage.setItem(preferenceKey, choice);
      } catch {
        // The choice still applies to the current page if browser storage is unavailable.
      }
      applyChoice(choice);
      setPanelOpen(false);
    });
  }
  window.addEventListener("storage", (event) => {
    if (event.key === preferenceKey || event.key === null) {
      applyChoice(readChoice());
    }
  });

  for (const link of document.querySelectorAll("[data-download-placement]")) {
    link.addEventListener("click", () => {
      if (!tagRequested || window[disableKey]) return;
      window.gtag("event", "download_click", {
        send_to: measurementId,
        app_slug: "mijialan",
        platform: "macos",
        store: "github",
        locale: document.documentElement.lang,
        placement: link.dataset.downloadPlacement,
        link_url: link.origin + link.pathname,
      });
    });
  }

  applyChoice(readChoice());
})();
