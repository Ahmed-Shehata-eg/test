import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/*
 * Setup:
 * 1. Replace both values below with the Supabase project URL and publishable/anon key.
 * 2. Enable Google in Supabase Authentication > Providers.
 * 3. Add this site's URL to Supabase Auth URL Configuration.
 * The publishable/anon key is intended for browser use; never put service-role keys here.
 */
const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY";

const button = document.querySelector("#google-auth-button");
const status = document.querySelector("#auth-status");
const buttonLabel = document.querySelector("#google-auth-label");
const isConfigured =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("YOUR_PROJECT_ID") &&
  SUPABASE_PUBLISHABLE_KEY.length > 20 &&
  !SUPABASE_PUBLISHABLE_KEY.includes("YOUR_SUPABASE");

if (!button || !status) {
  // This module is safe to include on pages that do not contain the auth controls.
} else if (!isConfigured) {
  button.addEventListener("click", () => {
    status.textContent = "تسجيل Google يحتاج إعداد Supabase أولًا.";
  });
} else {
  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

  function renderUser(user) {
    if (user) {
      if (buttonLabel) buttonLabel.textContent = "تسجيل الخروج";
      button.setAttribute("aria-label", "تسجيل الخروج من حساب الطالب");
      status.textContent = user.email ? `مرحبًا، ${user.email}` : "تم تسجيل الدخول";
    } else {
      if (buttonLabel) buttonLabel.textContent = "تسجيل الدخول بـ Google";
      button.setAttribute("aria-label", "تسجيل الدخول باستخدام Google");
      status.textContent = "";
    }
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    renderUser(session?.user ?? null);
  });

  supabase.auth.getSession().then(({ data, error }) => {
    if (error) status.textContent = "تعذر التحقق من جلسة الدخول.";
    renderUser(data?.session?.user ?? null);
  });

  button.addEventListener("click", async () => {
    button.disabled = true;
    status.textContent = "جارٍ الاتصال...";
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        renderUser(null);
      } else {
        const redirectTo = window.location.origin + window.location.pathname;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo }
        });
        if (error) throw error;
      }
    } catch (error) {
      status.textContent = "تعذر تسجيل الدخول. راجع إعدادات Supabase وحاول مرة أخرى.";
      console.error("Google sign-in error:", error);
    } finally {
      button.disabled = false;
    }
  });

  window.addEventListener("pagehide", () => subscription.unsubscribe(), { once: true });
}
