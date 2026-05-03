# Parent Reset — Deployment Guide

## File Structure

```
Parentreset/
├── index.html                        ← Main landing page
├── success.html                      ← Post-payment page (Calendly embed)
├── style.css                         ← Full design system
├── script.js                         ← Chatbot + animations + Stripe
├── package.json                      ← Stripe dependency for Netlify Functions
├── netlify.toml                      ← Netlify build + security config
├── .gitignore
└── netlify/
    └── functions/
        └── create-checkout.js        ← Stripe checkout serverless function
```

---

## Step 1 — Push to GitHub

```bash
cd "C:\Users\kingstonchen\Parentreset"
git init
git add .
git commit -m "feat: initial parent reset website"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

---

## Step 2 — Connect to Netlify

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **"Add new site" → "Import an existing project"**
3. Choose **GitHub** → select your `parentreset` repo
4. Build settings:
   - **Build command:** `npm install`
   - **Publish directory:** `.` (just a dot — the root)
5. Click **Deploy site**

Your site will be live at `https://something-random.netlify.app`

---

## Step 3 — Set Environment Variables in Netlify

Go to: **Site settings → Environment variables → Add a variable**

| Variable | Value | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` | From your Stripe dashboard |
| `SESSION_PRICE_CENTS` | `18000` | SGD 180.00 = 18000 cents. Change to your price. |

> ⚠️ Use `sk_test_...` first to test payments before going live.

---

## Step 4 — Stripe Setup

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Get your API keys:** Developers → API keys → Secret key
3. **Set your webhook** (optional but recommended):
   - Endpoint URL: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
   - Events to listen for: `checkout.session.completed`
4. After adding env vars to Netlify → **Trigger a redeploy**

---

## Step 5 — Calendly Setup

1. Create your [Calendly](https://calendly.com) account
2. Create a **60-minute event type** named "Parent Reset Session"
3. In your Calendly event settings, add **intake questions:**
   - Child's name
   - Child's age
   - "What is the moment that keeps breaking you?" (paragraph)
4. Copy your Calendly event URL (e.g. `https://calendly.com/sharon-pr/reset`)
5. Open `success.html` and replace `YOUR_CALENDLY_LINK` with your URL:
   ```html
   data-url="https://calendly.com/sharon-pr/reset"
   ```

---

## Step 6 — Custom Domain (optional)

In Netlify: **Domain management → Add custom domain**

If your domain is managed by another registrar:
- Add a `CNAME` record pointing to your Netlify subdomain
- Or transfer DNS to Netlify for automatic SSL

---

## Step 7 — Swap In Sharon's Photo

In `index.html`, find the About section and replace:
```html
<div class="about__img-placeholder">...</div>
```
with:
```html
<img src="sharon.jpg" alt="Sharon, Parent Reset Coach" loading="lazy">
```

Add `sharon.jpg` to the root of the repo.

---

## Step 8 — Update Contact Email

Search and replace `sharon@parentreset.com` with Sharon's actual email in:
- `index.html` (footer)
- `success.html`
- `netlify/functions/create-checkout.js` (error message)

---

## Testing Checklist

- [ ] Form validation works (try submitting empty)
- [ ] Chatbot opens and runs through all 5 steps
- [ ] Stripe test payment completes (use card `4242 4242 4242 4242`, any future date, any CVC)
- [ ] Success page loads with Calendly embed
- [ ] Mobile responsive (test at 375px)
- [ ] Lighthouse score: Performance ≥ 85, Accessibility ≥ 90

---

## Stripe Test Cards

| Card | Result |
|---|---|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 0002` | Payment declined |
| `4000 0025 0000 3155` | Requires 3D Secure |

Use any future expiry date and any 3-digit CVC.

---

## Going Live

1. Switch `STRIPE_SECRET_KEY` from `sk_test_...` to `sk_live_...`
2. Update `SESSION_PRICE_CENTS` to your real price
3. Trigger redeploy in Netlify
4. Test with a real SGD 1 charge to confirm end-to-end

---

*Built with: HTML · CSS · Vanilla JS · Netlify Functions · Stripe Checkout · Calendly*
