(function () {
  "use strict";

  var TOKEN_PATTERN = /^[A-Za-z0-9_-]{22,64}$/;

  // Verified public store URLs support the manual post-install recovery flow.
  // This is not automatic deferred deep linking.
  var MIVARO_STORE_URLS = Object.freeze({
    appStore: "https://apps.apple.com/us/app/mivaro/id6802352751",
    playStore: "https://play.google.com/store/apps/details?id=com.saaddigital.mivaro",
  });

  var parameters = new URLSearchParams(window.location.search);
  var capabilities = parameters.getAll("c");
  var capability = capabilities.length === 1 ? capabilities[0] : "";
  var isValidCapability = TOKEN_PATTERN.test(capability);
  var title = document.querySelector("#share-title");
  var intro = document.querySelector("#share-intro");
  var openButton = document.querySelector("#open-mivaro");
  var status = document.querySelector("#share-status");
  var postInstallNote = document.querySelector("#post-install-note");
  var storeActions = document.querySelector("#mivaro-store-actions");
  var appStoreButton = document.querySelector("#mivaro-app-store");
  var playStoreButton = document.querySelector("#mivaro-play-store");

  function verifiedStoreUrl(value) {
    if (!value) {
      return "";
    }

    try {
      var url = new URL(value);
      return url.protocol === "https:" ? url.href : "";
    } catch (error) {
      return "";
    }
  }

  function configureStoreActions() {
    var appStoreUrl = verifiedStoreUrl(MIVARO_STORE_URLS.appStore);
    var playStoreUrl = verifiedStoreUrl(MIVARO_STORE_URLS.playStore);
    var userAgent = navigator.userAgent || "";
    var isAndroid = /Android/i.test(userAgent);
    var isAppleMobile = /iPhone|iPad|iPod/i.test(userAgent) ||
      (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1);

    if (appStoreUrl && !isAndroid) {
      appStoreButton.href = appStoreUrl;
      appStoreButton.hidden = false;
    }

    if (playStoreUrl && !isAppleMobile) {
      playStoreButton.href = playStoreUrl;
      playStoreButton.hidden = false;
    }

    storeActions.hidden = appStoreButton.hidden && playStoreButton.hidden;
  }

  if (!isValidCapability) {
    title.textContent = "This reminder link isn't available.";
    intro.textContent = "Check that you opened the complete link, or ask the sender to share it again.";
    status.textContent = "No reminder information has been displayed or requested.";
    return;
  }

  openButton.href = "mivaro://r/" + encodeURIComponent(capability);
  openButton.hidden = false;
  postInstallNote.hidden = false;
  status.textContent = "Mivaro will let you review the shared reminder before saving it.";

  openButton.addEventListener("click", function () {
    window.setTimeout(function () {
      status.textContent = "If Mivaro did not open, keep this page and try again after the app is installed.";
    }, 900);
  });

  configureStoreActions();
})();
