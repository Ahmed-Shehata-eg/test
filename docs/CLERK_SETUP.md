# Clerk authentication and EasyKash setup

This repository is a static HTML/CSS/JavaScript website. The existing `feature/platform-foundation` branch contains a Clerk browser-SDK integration; it does not require converting the project to Next.js.

## 1. Connect the selected Clerk application

1. In the Clerk Dashboard, select the existing application you chose. Do not create a replacement application.
2. Open **API keys** and copy its **Publishable Key**. It starts with `pk_test_` for development or `pk_live_` for production.
3. In `auth.js` on the `feature/platform-foundation` branch, replace `YOUR_CLERK_PUBLISHABLE_KEY` with that Publishable Key.
4. Never put a Clerk **Secret Key** (starts with `sk_test_` or `sk_live_`) in browser JavaScript, HTML, CSS, GitHub, or a chat.
5. In the Clerk Dashboard, open **User & authentication**:
   - Enable phone number as a sign-up/sign-in identifier.
   - Enable passwords as a sign-in method.
   - Follow Clerk's verification requirements for new phone numbers.
6. In Clerk's **SMS** settings, allow Egypt (+20) if students in Egypt should receive verification codes. Test with a phone number you control.
7. Add the deployed website origin to the Clerk application's allowed domains/origins as required by the Dashboard. Test development and production origins separately.
8. Test sign-up, phone verification, sign-out, sign-in, and a page refresh on the deployed website.

**Important:** Clerk documents phone-number authentication as a paid-plan feature for production; it can be tested in development. SMS country availability and charges apply, so check the current Clerk plan and SMS settings before launch.

The frontend integration uses Clerk's official browser SDK CDN. A Publishable Key is intended for browser use; the Secret Key is not. Do not announce authentication as live until the deployed flow has been tested.

Official Clerk documentation:
- JavaScript quickstart: https://clerk.com/docs/js-frontend/getting-started/quickstart
- Sign-up/sign-in options: https://clerk.com/docs/guides/configure/auth-strategies/sign-up-sign-in-options
- Publishable and secret keys: https://clerk.com/docs/guides/development/clerk-environment-variables

## Existing user accounts

Switching authentication providers does not automatically transfer users, passwords, or sessions from Supabase to Clerk. The previous Supabase setup used placeholders, and this repository does not show a configured Supabase connection. Still, confirm whether any real users exist before abandoning the old provider. Never ask users to share passwords.

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

- Clerk browser integration: present on `feature/platform-foundation`; awaiting the selected application's Publishable Key, Dashboard configuration, and live-flow testing.
- Supabase user migration: not performed; confirm whether any real users exist before abandoning Supabase.
- EasyKash: not activated. Do not announce payments as live until a successful sandbox transaction and server-side payment verification have been tested.
