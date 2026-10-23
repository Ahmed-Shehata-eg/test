// Clerk authentication for the static HTML website.
// Use the Publishable Key from the EXISTING Clerk application.
// A publishable key is intended for browser use; never put a Clerk Secret Key here.
const CLERK_PUBLISHABLE_KEY = "pk_test_Z3VpZGVkLXN0YXJsaW5nLTk0MTAuY2xlcmsuYWNjb3VudHMuZGV2JA";

const openButton = document.querySelector("#phone-auth-open");
const status = document.querySelector("#auth-status");
const dialog = document.querySelector("#phone-auth-dialog");
const closeButton = document.querySelector("#phone-auth-close");
const authMount = document.querySelector("#clerk-auth-mount");
const message = document.querySelector("#clerk-auth-message");

let clerk = null;
let signInMounted = false;

const isConfigured = /^(pk_test_|pk_live_)/.test(CLERK_PUBLISHABLE_KEY) &&
  !CLERK_PUBLISHABLE_KEY.includes("YOUR_CLERK_PUBLISHABLE_KEY");

function showMessage(text, isError = false) {
  if (!message) return;
  message.textContent = text;
  message.style.color = isError ? "#b42318" : "var(--ink)";
}

function frontendApiDomain(publishableKey) {
  const parts = publishableKey.split("_");
  if (parts.length < 3 || !parts[2]) return null;

  let encoded = parts[2].replace(/-/g, "+").replace(/_/g, "/");
  while (encoded.length % 4) encoded += "=";

  try {
    return atob(encoded).replace(/\$$/, "");
  } catch {
    return null;
  }
}

function loadScript(src, publishableKey = "") {
  return new Promise((resolve, reject) => {
    const existing = [...document.scripts].find((script) => script.src === src);
    if (existing) {
      if (existing.dataset.loaded === "true") resolve();
      else {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    if (publishableKey) script.dataset.clerkPublishableKey = publishableKey;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    }, { once: true });
    script.addEventListener("error", () => reject(new Error("Could not load Clerk from its CDN.")), { once: true });
    document.head.appendChild(script);
  });
}

function renderUser() {
  if (!clerk || !openButton || !status) return;
  const user = clerk.user;
  if (clerk.isSignedIn && user) {
    status.textContent =
      user.primaryPhoneNumber?.phoneNumber ||
      user.primaryEmailAddress?.emailAddress ||
      user.fullName ||
      user.firstName ||
      "تم تسجيل الدخول";
    openButton.textContent = "تسجيل الخروج";
  } else {
    status.textContent = "";
    openButton.textContent = "الدخول إلى حساب الطالب";
  }
}

async function mountSignIn() {
  if (!clerk || !authMount || signInMounted) return;
  authMount.replaceChildren();
  clerk.mountSignIn(authMount, {
    appearance: {
      variables: { colorPrimary: "#173d36", colorText: "#173d36" },
      elements: { rootBox: { width: "100%" } },
    },
  });
  signInMounted = true;
}

async function openAuthDialog() {
  if (!dialog) return;
  if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();

  if (!isConfigured) {
    showMessage("أضف Clerk Publishable Key من لوحة Clerk إلى auth.js أولًا.", true);
    return;
  }

  if (!clerk) {
    showMessage("جارٍ تحميل خدمة تسجيل الدخول...");
    try {
      const domain = frontendApiDomain(CLERK_PUBLISHABLE_KEY);
      if (!domain) throw new Error("The Clerk Publishable Key format is not valid.");

      await loadScript(`https://${domain}/npm/@clerk/ui@1/dist/ui.browser.js`);
      await loadScript(
        `https://${domain}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`,
        CLERK_PUBLISHABLE_KEY,
      );

      if (!window.Clerk) throw new Error("Clerk did not initialize.");
      clerk = window.Clerk;
      await clerk.load({ ui: { ClerkUI: window.__internal_ClerkUICtor } });
      clerk.addListener(() => {
        renderUser();
        if (clerk?.isSignedIn && dialog?.open) dialog.close();
      });
      renderUser();
    } catch (error) {
      console.error("Clerk initialization error:", error);
      showMessage("تعذر تحميل تسجيل الدخول. تحقق من المفتاح وإعدادات تطبيق Clerk ثم أعد المحاولة.", true);
      return;
    }
  }

  if (clerk.isSignedIn) {
    if (dialog?.open) dialog.close();
    return;
  }

  try {
    showMessage("");
    await mountSignIn();
  } catch (error) {
    console.error("Clerk sign-in UI error:", error);
    showMessage("تعذر عرض نموذج الدخول. راجع إعدادات Clerk وحاول مرة أخرى.", true);
  }
}

if (openButton) {
  openButton.addEventListener("click", async () => {
    if (clerk?.isSignedIn) {
      openButton.disabled = true;
      try {
        await clerk.signOut();
        renderUser();
        showMessage("تم تسجيل الخروج.");
      } catch (error) {
        console.error("Clerk sign-out error:", error);
        showMessage("تعذر تسجيل الخروج. حاول مرة أخرى.", true);
      } finally {
        openButton.disabled = false;
      }
    } else {
      await openAuthDialog();
    }
  });
}

if (closeButton && dialog) closeButton.addEventListener("click", () => dialog.close());
if (dialog) {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    if (clerk && authMount && signInMounted) {
      clerk.unmountSignIn(authMount);
      signInMounted = false;
    }
    showMessage("");
  });
}

// Clerk initializes when the student opens the sign-in dialog. This avoids
// opening a modal automatically on page load.
