# Google login and EasyKash integration setup

This repository currently uses a static HTML/CSS/JavaScript frontend. Google OAuth can be connected through Supabase Auth, but online payments must be created and verified by a trusted server-side function.

## 1. Google sign-in

1. Create or select a Supabase project.
2. In Supabase, open **Authentication → Providers → Google** and enable the provider.
3. In Google Cloud, create an OAuth client for a web application.
4. Configure the Google OAuth consent screen and add the authorized JavaScript origin for the deployed site.
5. Add the callback URL shown by the Supabase Google provider page to Google's **Authorized redirect URIs**.
6. In Supabase **Authentication → URL Configuration**, set the deployed site URL and allow the exact redirect URL for this site. Add a local development URL only if needed.
7. In `auth.js`, replace `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. The browser publishable/anon key is not a secret; do not use a service-role key in frontend code.
8. Configure Row Level Security (RLS) for any student/profile/course tables before storing student information.

Official guide: https://supabase.com/docs/guides/auth/social-login/auth-google

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


## 1b. Phone number login with SMS OTP

The frontend now includes an Egyptian mobile number form and a six-digit SMS verification flow using Supabase Auth.

1. In the Supabase dashboard, open **Authentication → Providers** and enable **Phone**.
2. Configure an SMS provider supported by Supabase (for example, Twilio, Vonage, or MessageBird) and save the provider credentials only in Supabase's dashboard.
3. Test with a number you control before opening sign-in to students.
4. Configure rate limits and CAPTCHA to reduce unwanted SMS sending and cost.
5. In `auth.js`, set the Supabase project URL and publishable/anon key. Never put service-role keys or SMS-provider secrets in frontend code.

Official guide: https://supabase.com/docs/guides/auth/phone-login

The UI and client flow are prepared, but SMS delivery will not work until a real Supabase project and SMS provider are configured. Phone sign-in can create an account for a new number by default; plan student-account and course-access rules before granting paid content.
