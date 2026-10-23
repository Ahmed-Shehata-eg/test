import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/*
 * Setup:
 * - Replace these placeholders with your Supabase project URL and publishable/anon key.
 * - Enable Google in Supabase Authentication > Providers.
 * - Enable Phone authentication and configure an SMS provider in Supabase.
 * - Add the deployed site's URL to Supabase Auth URL Configuration.
 * Never put a Supabase service-role key or SMS-provider secret in this browser file.
 */
const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY";

const googleButton = document.querySelector("#google-auth-button");
const googleLabel = document.querySelector("#google-auth-label");
const phoneOpenButton = document.querySelector("#phone-auth-open");
const status = document.querySelector("#auth-status");
const phoneDialog = document.querySelector("#phone-auth-dialog");
const phoneCloseButton = document.querySelector("#phone-auth-close");
const sendForm = document.querySelector("#phone-send-form");
const verifyForm = document.querySelector("#phone-verify-form");
const phoneInput = document.querySelector("#login-phone");
const otpInput = document.querySelector("#phone-otp");
const sendButton = document.querySelector("#phone-send-code");
const verifyButton = document.querySelector("#phone-verify-code");
const changeNumberButton = document.querySelector("#phone-change-number");
const phoneMessage = document.querySelector("#phone-auth-message");

const isConfigured =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("YOUR_PROJECT_ID") &&
  SUPABASE_PUBLISHABLE_KEY.length > 20 &&
  !SUPABASE_PUBLISHABLE_KEY.includes("YOUR_SUPABASE");

let supabase = null;
let pendingPhone = "";

function setPhoneMessage(message, isError = false) {
  if (!phoneMessage) return;
  phoneMessage.textContent = message;
  phoneMessage.style.color = isError ? "#b42318" : "var(--ink)";
}

function normalizeEgyptianPhone(value) {
  const cleaned = value.trim().replace(/[\s()-]/g, "");
  if (/^\+201[0125]\d{8}$/.test(cleaned)) return cleaned;
  if (/^01[0125]\d{8}$/.test(cleaned)) return "+2" + cleaned;
  if (/^201[0125]\d{8}$/.test(cleaned)) return "+" + cleaned;
  return null;
}

function renderUser(user) {
  if (googleButton) {
    if (googleLabel) googleLabel.textContent = user ? "تسجيل الخروج" : "تسجيل الدخول بـ Google";
    googleButton.setAttribute("aria-label", user ? "تسجيل الخروج من حساب الطالب" : "تسجيل الدخول باستخدام Google");
  }
  if (status) status.textContent = user ? (user.phone || user.email || "تم تسجيل الدخول") : "";
}

function setBusy(button, busy, busyText, normalText) {
  if (!button) return;
  button.disabled = busy;
  if (busy) {
    button.dataset.normalText = button.textContent;
    button.textContent = busyText;
  } else {
    button.textContent = normalText || button.dataset.normalText || button.textContent;
  }
}

if (googleButton && phoneOpenButton && status) {
  if (!isConfigured) {
    const setupMessage = "تسجيل الدخول يحتاج إعداد مشروع Supabase أولًا.";
    googleButton.addEventListener("click", () => { status.textContent = setupMessage; });
    phoneOpenButton.addEventListener("click", () => {
      if (phoneDialog && typeof phoneDialog.showModal === "function") phoneDialog.showModal();
      setPhoneMessage(setupMessage, true);
    });
  } else {
    supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

    supabase.auth.onAuthStateChange((_event, session) => {
      renderUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) status.textContent = "تعذر التحقق من جلسة الدخول.";
      renderUser(data?.session?.user ?? null);
    });

    googleButton.addEventListener("click", async () => {
      setBusy(googleButton, true, "جارٍ الاتصال...", "تسجيل الدخول بـ Google");
      status.textContent = "جارٍ الاتصال...";
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
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
        setBusy(googleButton, false, "", "تسجيل الدخول بـ Google");
      }
    });

    phoneOpenButton.addEventListener("click", () => {
      setPhoneMessage("");
      if (sendForm) sendForm.hidden = false;
      if (verifyForm) verifyForm.hidden = true;
      if (phoneDialog && typeof phoneDialog.showModal === "function") phoneDialog.showModal();
    });

    if (phoneCloseButton && phoneDialog) {
      phoneCloseButton.addEventListener("click", () => phoneDialog.close());
      phoneDialog.addEventListener("click", (event) => {
        if (event.target === phoneDialog) phoneDialog.close();
      });
    }

    if (sendForm) sendForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const phone = normalizeEgyptianPhone(phoneInput?.value || "");
      if (!phone) {
        setPhoneMessage("اكتب رقم موبايل مصري صحيحًا، مثل +201012345678.", true);
        return;
      }
      pendingPhone = phone;
      setBusy(sendButton, true, "جارٍ إرسال الرمز...", "إرسال رمز التحقق");
      setPhoneMessage("جارٍ إرسال رمز التحقق برسالة SMS...");
      try {
        const { error } = await supabase.auth.signInWithOtp({
          phone: pendingPhone,
          options: { channel: "sms" }
        });
        if (error) throw error;
        sendForm.hidden = true;
        verifyForm.hidden = false;
        if (otpInput) otpInput.focus();
        setPhoneMessage("أدخل رمز التحقق الذي وصلك برسالة SMS.");
      } catch (error) {
        setPhoneMessage("تعذر إرسال الرمز. تأكد من إعداد مزود SMS في Supabase وحاول مرة أخرى.", true);
        console.error("Phone OTP request failed:", error);
      } finally {
        setBusy(sendButton, false, "", "إرسال رمز التحقق");
      }
    });

    if (verifyForm) verifyForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const token = (otpInput?.value || "").trim();
      if (!pendingPhone || !/^\d{6}$/.test(token)) {
        setPhoneMessage("أدخل رمز التحقق المكوّن من 6 أرقام.", true);
        return;
      }
      setBusy(verifyButton, true, "جارٍ التحقق...", "تأكيد الرمز وتسجيل الدخول");
      setPhoneMessage("جارٍ التحقق من الرمز...");
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: pendingPhone,
          token,
          type: "sms"
        });
        if (error) throw error;
        renderUser(data.user);
        setPhoneMessage("تم تسجيل الدخول بنجاح.");
        window.setTimeout(() => phoneDialog?.close(), 700);
      } catch (error) {
        setPhoneMessage("الرمز غير صحيح أو انتهت صلاحيته. حاول مرة أخرى.", true);
        console.error("Phone OTP verification failed:", error);
      } finally {
        setBusy(verifyButton, false, "", "تأكيد الرمز وتسجيل الدخول");
      }
    });

    if (changeNumberButton) changeNumberButton.addEventListener("click", () => {
      pendingPhone = "";
      if (otpInput) otpInput.value = "";
      if (verifyForm) verifyForm.hidden = true;
      if (sendForm) sendForm.hidden = false;
      setPhoneMessage("");
      phoneInput?.focus();
    });
  }
}
