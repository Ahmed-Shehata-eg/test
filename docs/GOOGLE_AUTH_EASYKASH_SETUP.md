# Clerk authentication and EasyKash setup

This repository is a static HTML/CSS/JavaScript website. The frontend has been prepared to use Clerk's browser SDK with the existing Clerk application selected in the Clerk Dashboard. It does not use a Next.js app.

## 1. Connect the existing Clerk application

1. Open the Clerk Dashboard and select the existing application you intended to use. Do not create a replacement application.
2. Open **API keys** for that application and copy its **Publishable Key**. It normally starts with `pk_test_` for development or `pk_live_` for production.
3. Open `auth.js` on the `feature/platform-foundation` branch and replace `YOUR_CLERK_PUBLISHABLE_KEY` with the Publishable Key.
4. Never copy a Clerk **Secret Key** (usually starts with `sk_test_` or `sk_live_`) into browser code, HTML, CSS, GitHub, or this chat.
5. In the Clerk Dashboard, open the sign-up/sign-in configuration and enable the identifiers and methods you want. To keep the requested phone/password flow, configure phone number as an allowed identifier and password as a sign-in method. If phone verification is required, configure Clerk's supported phone/SMS settings in the dashboard.
6. Add the website's deployed origin to the application's allowed origins/URLs as requested by Clerk. Set the correct development and production URLs for the site.
7. Test on the deployed site using a phone number you control: create an account, complete any verification Clerk requests, sign out, sign back in, and verify the session persists after a page refresh.

The frontend integration uses Clerk's official browser SDK CDN. A Publishable Key is designed to be public; the Secret Key is not. Do not announce authentication as live until the deployed flow has been tested.

Official Clerk documentation:
- JavaScript quickstart: https://clerk.com/docs/js-frontend/getting-started/quickstart
- Sign-up/sign-in options: https://clerk.com/docs/guides/configure/auth-strategies/sign-up-sign-in-options
- Publishable and secret keys: https://clerk.com/docs/guides/development/clerk-environment-variables

## Existing user accounts

Switching authentication providers does not automatically transfer users, passwords, or sessions from Supabase to Clerk. The previous Supabase file contained placeholder keys, so this repository does not show a configured Supabase connection; still, check whether any real users were created before removing or abandoning the old provider. If there are existing accounts, plan a safe migration rather than asking users to share passwords.

## 2. EasyKash online payments

EasyKash checkout is not implemented by this authentication change. A production checkout integration requires the merchant's approved API documentation and credentials from EasyKash. Do not guess API endpoints, signatures, request fields, or webhook verification rules.

Before implementing checkout, obtain:
- Merchant/API onboarding confirmation and official custom-checkout documentation.
- Test/sandbox credentials and production credentials, if available.
- Checkout creation endpoint and required fields.
- Callback/webhook signature verification requirements.
- Payment-status verification endpoint and refund/expiry behavior.

### Required secure flow

1. The signed-in student selects a course. The server looks up the course price from the database; it must not trust a price sent by the browser.
2. A server-side function creates a pending order with a unique internal order ID.
3. The server creates a checkout session/link with EasyKash using secrets stored in server-side environment variables.
4. The browser redirects to the returned checkout URL.
5. A browser redirect back to the site is not proof of payment. The server verifies the provider's signed webhook and/or calls the official payment-status endpoint.
6. Only after verification does the server mark the order paid and grant access to the matching course.
7. Make webhook handling idempotent, verify amount/currency/order ID, and record provider transaction IDs to prevent duplicate access.

Never put EasyKash API secrets in browser-delivered JavaScript or GitHub. Do not store card details. Keep course access checks on the server/database, not just in the UI.

Official EasyKash site: https://dev.easykash.net/

## Current implementation status

- Clerk frontend integration: prepared, pending the Publishable Key and Clerk Dashboard configuration/testing.
- Existing Supabase user migration: not performed; check whether any real users exist before abandoning Supabase.
- EasyKash: not activated. Do not announce payments as live until a successful sandbox transaction and server-side payment verification have been tested.
