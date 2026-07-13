# BITFLUX — Marketing Website

A modern, responsive landing page for **BITFLUX**, a crypto→cash finance app.

**Scope = the real app only.** Every feature shown maps to something that actually
exists in the live BITFLUX app. Template-derived items that we don't have (BF Earn,
BF Markets, the "Solutions" matrix, partner logos, fabricated license/country stats)
have been removed. BF Invest is shown as an honest "coming soon".

Real features covered:
- Multi-asset wallet (USDT / USD / BTC / ETH / USDC)
- Currency Swap (USDT/USDC → USD)
- BF Card (virtual + physical)
- Global fiat withdrawal (USD / SGD / HKD / GBP / EUR)
- Multi-chain deposit & withdraw (ERC20 / BEP20 / TRC20 / Polygon)
- Referral rewards (up to 10%)
- Differentiators: tiered KYC limits, transaction history + real-time notifications,
  6-digit transaction PIN + new-device alerts, dark/light + multilingual + PWA

Design:
- **Theme:** premium **warm-black & champagne-gold** (upgraded from the first pass —
  refined satin-gold gradient, film-grain texture, gold hairlines, line-icon system).
- **Brand assets:** real BITFLUX gold wordmark + favicon + glyph (in `assets/`).
- **App imagery:** **real screenshots** of the live app (in `assets/screenshots/`).

## Stack
Pure static site — no build step, no backend, no dependencies. Multi-page:
- `index.html` — **minimal UpFinance-style landing**: a spinning 3D gold coin hero
  (short headline + one CTA), compact 4-up highlights, real BF Card showcase, CTA, footer
- `features.html` — **detail page**: full feature grid, why/differentiators, stats,
  app preview gallery, how-it-works, security & KYC, referral, BF Invest teaser, FAQ
- `card.html` — **BF Card detail page**: card hero, three real card finishes
  (Golden / Black / Blue) and card benefits
- `coming-soon.html` — branded "coming soon" page (used by BF Invest), dynamic product name
- `styles.css` — premium black-gold theme + 3D coin + **in-phone HTML/CSS app mockups** + inline SVG icons + full responsive layout
- `app.js` — sticky nav, mobile menu, scroll-reveal, FAQ accordion, EN/中文 toggle, copy-link
- `assets/` — `bitflux-logo.png`, `bitflux-favicon.png`, `bitflux-icon.png`,
  `cards/` (real Visa Platinum card renders: `card-gold/black/blue.png`)

### App previews = code, not screenshots
The phone "screens" on `features.html` (wallet / swap / card / withdraw / history /
referral) and the KYC screen are **rebuilt in HTML/CSS with demo data** (`.mock` system
in `styles.css`). This means: no scroll-indicator artifacts, crisp at any resolution,
and **zero private data** baked in. The original raw screenshots contained a real name
and balance + a captured scroll bar, so they were moved out of the web root to
`../_private-screenshots-backup/` (not deployed). Do not re-add them without de-identifying.

## Features
- Bilingual: English / 简体中文 toggle (remembers choice, auto-detects browser)
- Real app screenshots in device frames (hero + preview gallery)
- Premium SVG line-icon system (no emoji)
- Fully responsive (desktop / tablet / mobile)
- Accessible: keyboard nav, reduced-motion support, semantic markup
- Telegram CTA → https://t.me/UpFinanceAI

## Preview locally
```bash
cd "/Users/karara/Downloads/JinhuiHK/05-bitflux技术支持/bitflux-website"
python3 -m http.server 8090 --bind 127.0.0.1 --directory .
# open http://127.0.0.1:8090
```
Or just open `index.html` directly in a browser (file://).

## To use your real app images
1. Add PNGs to `assets/screenshots/` (see that folder's README for the shot list).
2. Tell the assistant — it will swap the CSS mockups for your real screenshots
   and/or add a dedicated app-preview gallery.

## Customize
- Brand colors: edit the `:root` CSS variables in `styles.css`.
- Copy / translations: edit the `I18N` object in `app.js` and the `data-i18n` text in `index.html`.
- Links: update the Telegram / app URLs in `index.html`.
