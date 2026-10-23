# Phone/password login and EasyKash integration setup

This repository uses a static HTML/CSS/JavaScript frontend. Student authentication is prepared to use Supabase phone/password auth, including SMS confirmation and phone-verified password reset. Authentication will not work until the Supabase project and SMS provider are configured. Online payments must be created and verified by a trusted server-side function.

## 1. Phone number + password authentication

1. Open or create your Supabase project.
2. In Supabase, open **Authentication → Providers** and enable **Phone** authentication.
3. Configure a supported SMS provider in Supabase. Keep its credentials in the Supabase dashboard, never in GitHub or browser JavaScript. SMS messages may cost money.
4. In the project settings, copy the **Project URL** and the browser **publishable key** (or legacy anon key).
5. In `auth.js`, replace `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` with those values. Do not use a service-role key in frontend code.
6. In **Authentication → URL Configuration**, set the deployed website URL as the Site URL and add any exact development URLs you use.
7. Test sign-up with a phone number you control: create account → enter the SMS code → sign out → sign in with phone/password → test forgot-password and new-password flow.
8. Set reasonable SMS rate limits and enable CAPTCHA/anti-abuse protections before sharing the site publicly.
9. Use database Row Level Security (RLS) before storing student profile, course, or enrollment data. Authentication alone does not grant or protect access to paid lessons.

Official guides:
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/phone-login

**Important:** phone-number accounts depend on continued control of the phone number; numbers can be reassigned. Consider additional authentication protections before using accounts for sensitive or paid content. Do not announce login as live until the complete flow has been tested on the deployed site.

## 2. EasyKash online payments

EasyKash advertises payment links and custom API integrations. A production checkout integration requires the merchant's approved API documentation and credentials from EasyKash. Do not guess API endpoints, signatures, request fields, or webhook verification rules.

Before implementing checkout, obtain from EasyKash:
- Merchant/API onboarding confirmation and the official API documentation for custom checkout.
- Test/sandbox credentials and production credentials, if available.
- The exact checkout creation endpoint and required fields.
- The required callback/webhook signature verification process.
- The payment-status verification endpoint and refund/expiry behavior.
- The provider's guidance for recurring subscriptions versus one-time course payments.

### Required secure flow

1. The signed-in student selects a course. The server looks up the course price from the database; it must not trust a price sent by the browser.
2. A server-side function creates a pending order with a unique internal order ID.
3. The server creates a checkout session/link with EasyKash using secrets stored in server-side environment variables.
4. The browser redirects to the returned checkout URL.
5. A browser redirect back to the site is not proof of payment. The server verifies the provider's signed webhook and/or calls the official payment-status endpoint.
6. Only after verification does the server mark the order paid and grant access to the matching course.
7. Make webhook handling idempotent, verify amount/currency/order ID, and record provider transaction IDs to prevent duplicate access.

Never put EasyKash API secrets in `index.html`, `auth.js`, GitHub, or any browser-delivered JavaScript. Do not store card details. Keep course access checks on the server/database, not just in the UI.

Official EasyKash site: https://dev.easykash.net/

## 2. EasyKash online payments

EasyKash advertises payment links and custom API integrations. A production checkout integration requires the merchant's approved API documentation and credentials from EasyKash. Do not guess API endpoints, signatures, request fields, or webhook verification rules.

Before implementing checkout, obtain from EasyKash:
- Merchant/API onboarding confirmation and the official API documentation for custom checkout.
- Test/sandbox credentials and production credentials, if available.
- The exact checkout creation endpoint and required fields.
- The required callback/webhook signature verification process.
- The payment-status verification endpoint and refund/expiry behavior.
- The provider's guidance for recurring subscriptions versus one-time course payments.

### Required secure flow

1. The signed-in student selects a course. The server looks up the course price from the database; it must not trust a price sent by the browser.
2. A server-side function creates a pending order with a unique internal order ID.
3. The server creates a checkout session/link with EasyKash using secrets stored in server-side environment variables.
4. The browser redirects to the returned checkout URL.
5. A browser redirect back to the site is not proof of payment. The server verifies the provider's signed webhook and/or calls the official payment-status endpoint.
6. Only after verification does the server mark the order paid and grant access to the matching course.
7. Make webhook handling idempotent, verify amount/currency/order ID, and record provider transaction IDs to prevent duplicate access.

Never put EasyKash API secrets in `index.html`, `auth.js`, GitHub, or any browser-delivered JavaScript. Do not store card details. Keep course access checks on the server/database, not just in the UI.

Official EasyKash site: https://dev.easykash.net/

## Current implementation status

- Google sign-in UI and Supabase OAuth client: added, pending Supabase/Google dashboard configuration.
- EasyKash: not activated yet. The exact API integration must be based on the merchant documentation supplied by EasyKash; the existing payment area is not proof that online checkout is active.
- Do not announce that payments are live until a successful sandbox transaction and webhook verification have been tested.


