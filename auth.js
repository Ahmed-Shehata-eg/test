import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Use the Supabase project URL and browser publishable/anon key only.
// Never place a service-role key or SMS-provider secret in this file.
const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY";

const openButton = document.querySelector("#phone-auth-open");
const status = document.querySelector("#auth-status");
const dialog = document.querySelector("#phone-auth-dialog");
const closeButton = document.querySelector("#phone-auth-close");
const modeSelect = document.querySelector("#auth-mode");
const phoneInput = document.querySelector("#login-phone");
const passwordInput = document.querySelector("#login-password");
const confirmPasswordInput = document.querySelector("#confirm-password");
const phoneForm = document.querySelector("#password-auth-form");
const otpForm = document.querySelector("#phone-verify-form");
const otpInput = document.querySelector("#phone-otp");
const resetPasswordForm = document.querySelector("#reset-password-form");
const resetPasswordInput = document.querySelector("#reset-password");
const resetPasswordConfirmInput = document.querySelector("#reset-password-confirm");
const message = document.querySelector("#phone-auth-message");
const submitButton = document.querySelector("#password-auth-submit");
const verifyButton = document.querySelector("#phone-verify-code");
const resetButton = document.querySelector("#reset-password-submit");
const changePhoneButton = document.querySelector("#phone-change-number");
const isConfigured = SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("YOUR_PROJECT_ID") &&
  SUPABASE_PUBLISHABLE_KEY.length > 20 &&
  !SUPABASE_PUBLISHABLE_KEY.includes("YOUR_SUPABASE");

let supabase = null;
let pendingPhone = "";
let pendingMode = "signup";

function showMessage(text, isError = false) {
  if (!message) return;
  message.textContent = text;
  message.style.color = isError ? "#b42318" : "var(--ink)";
}
function normalizePhone(value) {
  const cleaned = value.trim().replace(/[\s()-]/g, "");
  if (/^\+201[0125]\d{8}$/.test(cleaned)) return cleaned;
  if (/^01[0125]\d{8}$/.test(cleaned)) return "+2" + cleaned;
  if (/^201[0125]\d{8}$/.test(cleaned)) return "+" + cleaned;
  return null;
}
function busy(button, value, busyText, normalText) {
  if (!button) return;
  if (value) {
    button.dataset.normalText = button.textContent;
    button.disabled = true;
    button.textContent = busyText;
  } else {
    button.disabled = false;
    button.textContent = normalText || button.dataset.normalText || button.textContent;
  }
}
function setMode(mode) {
  if (modeSelect) modeSelect.value = mode;
  if (phoneForm) phoneForm.hidden = false;
  if (otpForm) otpForm.hidden = true;
  if (resetPasswordForm) resetPasswordForm.hidden = true;
  if (passwordInput) passwordInput.hidden = mode === "forgot";
  if (confirmPasswordInput) confirmPasswordInput.hidden = mode !== "signup";
  const passwordLabel = document.querySelector("#password-label");
  const confirmLabel = document.querySelector("#confirm-password-label");
  if (passwordLabel) passwordLabel.hidden = mode === "forgot";
  if (confirmLabel) confirmLabel.hidden = mode !== "signup";
  if (submitButton) submitButton.textContent = mode === "signup" ? "إنشاء حساب" : mode === "forgot" ? "إرسال رمز الاستعادة" : "تسجيل الدخول";
  showMessage("");
}
function renderUser(user) {
  if (status) status.textContent = user ? (user.phone || "تم تسجيل الدخول") : "";
  if (openButton) openButton.textContent = user ? "تسجيل الخروج" : "الدخول برقم الموبايل";
}
function openDialog() {
  if (!dialog) return;
  setMode("login");
  if (typeof dialog.showModal === "function") dialog.showModal();
}
if (openButton && status) {
  if (!isConfigured) {
    openButton.addEventListener("click", () => {
      if (dialog && typeof dialog.showModal === "function") dialog.showModal();
      showMessage("أضف رابط مشروع Supabase والمفتاح العام في auth.js أولًا.", true);
    });
  } else {
    supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    supabase.auth.onAuthStateChange((_event, session) => renderUser(session?.user ?? null));
    supabase.auth.getSession().then(({data,error}) => {
      if (error) status.textContent = "تعذر التحقق من جلسة الدخول.";
      renderUser(data?.session?.user ?? null);
    });
    openButton.addEventListener("click", async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) { status.textContent = "تعذر التحقق من جلسة الدخول."; return; }
      if (session) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) status.textContent = "تعذر تسجيل الخروج.";
        else renderUser(null);
      } else openDialog();
    });
    if (closeButton && dialog) closeButton.addEventListener("click", () => dialog.close());
    if (dialog) dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    if (modeSelect) modeSelect.addEventListener("change", () => setMode(modeSelect.value));

    if (phoneForm) phoneForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const phone = normalizePhone(phoneInput?.value || "");
      const mode = modeSelect?.value || "login";
      const password = passwordInput?.value || "";
      if (!phone) { showMessage("اكتب رقم موبايل مصري صحيحًا، مثل +201012345678.", true); return; }
      if (mode !== "forgot" && password.length < 8) { showMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل.", true); return; }
      if (mode === "signup" && password !== (confirmPasswordInput?.value || "")) { showMessage("كلمتا المرور غير متطابقتين.", true); return; }
      pendingPhone = phone;
      pendingMode = mode;
      busy(submitButton, true, "جارٍ المعالجة...");
      try {
        if (mode === "signup") {
          const { data, error } = await supabase.auth.signUp({ phone, password });
          if (error) throw error;
          if (data.session) {
            renderUser(data.user);
            showMessage("تم إنشاء الحساب وتسجيل الدخول بنجاح.");
            return;
          }
          phoneForm.hidden = true;
          otpForm.hidden = false;
          showMessage("أرسلنا رمز تأكيد إلى هاتفك. أدخله لإكمال إنشاء الحساب.");
        } else if (mode === "login") {
          const { data, error } = await supabase.auth.signInWithPassword({ phone, password });
          if (error) throw error;
          renderUser(data.user);
          showMessage("تم تسجيل الدخول بنجاح.");
          window.setTimeout(() => dialog?.close(), 700);
        } else {
          const { error } = await supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser: false, channel: "sms" } });
          if (error) throw error;
          phoneForm.hidden = true;
          otpForm.hidden = false;
          showMessage("إذا كان الرقم مرتبطًا بحساب، فسيصلك رمز تحقق. أدخله للمتابعة.");
        }
      } catch (error) {
        const fallback = mode === "signup" ? "تعذر إنشاء الحساب. تأكد من إعدادات الهاتف وSMS، أو جرّب رقمًا آخر." : mode === "login" ? "تعذر تسجيل الدخول. تحقق من الرقم وكلمة المرور." : "تعذر إرسال رمز الاستعادة. تأكد من الرقم وإعدادات SMS.";
        showMessage(fallback, true);
        console.error("Phone/password authentication error:", error);
      } finally {
        busy(submitButton, false);
      }
    });

    if (otpForm) otpForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const token = (otpInput?.value || "").trim();
      if (!pendingPhone || !/^\d{6}$/.test(token)) { showMessage("أدخل رمز التحقق المكوّن من 6 أرقام.", true); return; }
      busy(verifyButton, true, "جارٍ التحقق...");
      try {
        const { data, error } = await supabase.auth.verifyOtp({ phone: pendingPhone, token, type: "sms" });
        if (error) throw error;
        if (pendingMode === "forgot") {
          otpForm.hidden = true;
          if (resetPasswordForm) resetPasswordForm.hidden = false;
          showMessage("تم التحقق من رقمك. اختر كلمة مرور جديدة.");
        } else {
          renderUser(data.user);
          showMessage("تم تأكيد الرقم وإنشاء الحساب بنجاح.");
          window.setTimeout(() => dialog?.close(), 900);
        }
      } catch (error) {
        showMessage("الرمز غير صحيح أو انتهت صلاحيته. حاول مرة أخرى.", true);
        console.error("Phone verification error:", error);
      } finally {
        busy(verifyButton, false);
      }
    });

    if (resetPasswordForm) resetPasswordForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const password = resetPasswordInput?.value || "";
      if (password.length < 8) { showMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل.", true); return; }
      if (password !== (resetPasswordConfirmInput?.value || "")) { showMessage("كلمتا المرور غير متطابقتين.", true); return; }
      busy(resetButton, true, "جارٍ تحديث كلمة المرور...");
      try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        renderUser((await supabase.auth.getUser()).data.user);
        showMessage("تم تغيير كلمة المرور بنجاح.");
        window.setTimeout(() => dialog?.close(), 900);
      } catch (error) {
        showMessage("تعذر تغيير كلمة المرور. أعد التحقق من رقمك وحاول مرة أخرى.", true);
        console.error("Password reset error:", error);
      } finally {
        busy(resetButton, false);
      }
    });
    if (changePhoneButton) changePhoneButton.addEventListener("click", () => {
      pendingPhone = "";
      if (otpInput) otpInput.value = "";
      setMode(pendingMode);
      phoneInput?.focus();
    });
  }
}
