(() => {
  const picker = document.querySelector("[data-platform-picker]");
  if (!picker) return;

  const download = picker.querySelector("[data-hero-download]");
  const downloadLabel = download.querySelector("span");
  const toggle = picker.querySelector("[data-platform-toggle]");
  const toggleLabel = toggle.querySelector("span");
  const otherPlatformsLabel = toggleLabel.textContent;
  const list = picker.querySelector("#download-platforms");
  const options = [...list.querySelectorAll("[data-option-platform]")];
  const requirements = document.querySelector("[data-hero-requirements]");
  const release = document.querySelector("[data-hero-release]");
  const installers = {
    macos: document.querySelector('[data-download-platform="macos"]').href,
    windows:
      "https://github.com/iPocket-APP/MijiaLAN/releases/download/rs-v0.1.0-b14/MijiaLAN-rs-0.1.0-b14-windows-x86_64.msi",
    linux:
      "https://github.com/iPocket-APP/MijiaLAN/releases/download/rs-linux-v0.1.0-b1/MijiaLAN-rs-0.1.0-b1-linux-x86_64.deb",
  };

  function desktopPlatform() {
    const platform = navigator.userAgentData?.platform || navigator.platform;
    const hints = `${platform} ${navigator.userAgent}`;
    if (
      navigator.userAgentData?.mobile ||
      /Android|iPhone|iPad|iPod|CrOS|Chrome OS|Windows Phone|Mobile/i.test(hints) ||
      (/^Mac/i.test(platform) && navigator.maxTouchPoints > 1)
    ) {
      return null;
    }
    if (/\bWin(?:32|64|dows)\b/i.test(hints)) return "windows";
    if (/\bMac(?:intosh|Intel|OS)?\b/i.test(hints)) return "macos";
    if (/\bLinux\b/i.test(hints)) return "linux";
    return null;
  }

  function setOpen(open) {
    list.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
  }

  function selectPlatform(option) {
    const { optionPlatform, label, requirements: note, releaseLabel } = option.dataset;
    download.href = installers[optionPlatform];
    download.dataset.downloadPlatform = optionPlatform;
    downloadLabel.textContent = label;
    download.hidden = false;
    toggle.classList.remove("button-primary");
    toggleLabel.textContent = otherPlatformsLabel;
    requirements.textContent = note;
    release.hidden = !releaseLabel;
    if (releaseLabel) {
      release.href = document.getElementById(`release-${optionPlatform}`).href;
      release.textContent = releaseLabel;
    }
    for (const choice of options) choice.setAttribute("aria-pressed", String(choice === option));
  }

  const detected = desktopPlatform();
  const initialOption = options.find((option) => option.dataset.optionPlatform === detected);
  if (initialOption) {
    selectPlatform(initialOption);
  } else {
    toggleLabel.textContent = downloadLabel.textContent;
    toggle.classList.add("button-primary");
    download.hidden = true;
  }

  toggle.hidden = false;
  toggle.addEventListener("click", () => setOpen(list.hidden));
  for (const option of options) {
    option.addEventListener("click", () => {
      selectPlatform(option);
      setOpen(false);
      download.focus();
    });
  }
  picker.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || list.hidden) return;
    event.preventDefault();
    setOpen(false);
    toggle.focus();
  });
  picker.addEventListener("focusout", (event) => {
    if (!list.hidden && event.relatedTarget && !picker.contains(event.relatedTarget)) setOpen(false);
  });
  document.addEventListener("click", (event) => {
    if (!list.hidden && !picker.contains(event.target)) setOpen(false);
  });
})();
