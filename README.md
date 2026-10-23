# BITFLUX — Marketing Website

A modern, responsive landing page for **BITFLUX**, a crypto→cash finance app.

**Scope = the real app only.** Every feature shown maps to something that actually
exists in the live BITFLUX app. BF Invest is shown as an honest "coming soon".

## Claims policy (read before adding copy)
Only state what we can prove. If unsure, leave it out.
- **Registration:** the only one we hold is **FinCEN MSB, No. 31000328099115**
  (BitFlux Limited, received 2026-04-17; source: `../bitflux文件/msb_registration -BitFlux Limited.pdf`).
  It is a *registration*, not a license — never write "licensed" or "approved by FinCEN".
  Renew every two years: **by 31 Dec 2028**. Deliberately **not shown on the site**
  (not needed for Apple enrollment; give the PDF to App Review directly if asked).
- **Removed on 2026-10-23** (template leftovers with no evidence): SFC / MSO / TCSP / FCA / VQF /
  CMA / FSC / FSA / FSCA license badges, "10+ licenses · 8 jurisdictions · 173 countries",
  "$150B / $60B partner network" metrics, SOC 2 / ISO 27001 / PCI DSS badges, the partner
  name list, BF Earn, the demo investment return, "instant / in seconds / 7×24 / bank-grade".
- **Layout rule:** headings only, no gray description lines or footnotes under them (owner's call, 2026-10-23).
- Re-add a partner name only with a signed agreement; add the card issuer line
  ("issued by … pursuant to a licence from Visa") once the issuer is confirmed.

Real features covered (checked against `../测试报告-20260628`):
- Multi-asset wallet (USDT / USD / BTC / ETH / USDC)
- Currency Swap (USDT/USDC → USD)
- BF Card (virtual + physical). Card art shows Visa (Golden/Black) and Mastercard (Blue) —
  network not confirmed, so the copy names neither
- Global fiat withdrawal (USD / SGD / HKD / GBP / EUR)
- Crypto deposit on ERC20 / BEP20 / TRC20 / Polygon; withdrawal on ERC20 / BEP20 / TRC20
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
- `privacy.html` / `terms.html` — Privacy Policy and Terms of Service. Both languages live in the
  HTML (`.legal[data-legal="en|zh"]`); CSS shows the one matching `<html lang>`. English governs.
  Drafted from common templates — have a lawyer review before relying on them.
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

## Legal entity footer
Every page footer carries the legal entity block required for Apple Developer (organization)
enrollment: **BitFlux Limited**, the Mong Kok office address and
`info@bitflux.link`. It must match the D-U-N-S (D&B) record word for word — don't reword or
translate the name or address. The footer is identical across all pages; edit them together.

## Customize
- Brand colors: edit the `:root` CSS variables in `styles.css`.
- Copy / translations: edit the `I18N` object in `app.js` and the `data-i18n` text in `index.html`.
- Links: update the Telegram / app URLs in `index.html`.
