# Jubeliwatch

Website and store POS for Jubeliwatch: <https://jubeliwatch.github.io/>

It runs **without a server and without monthly costs**. GitHub Pages hosts the website, and the POS (`admin.html`) saves straight to GitHub with a token you set up on each device.

| Repo | Visibility | What's in it |
|---|---|---|
| `jubeliwatch/jubeliwatch.github.io` | Public | This website, the public collection (`data/katalog.json`, `foto/stok/`), Journal pages, and **encrypted** customer pages (repair status, receipts, agreements) |
| `jubeliwatch/jubeliwatch-shop-data` | **Private** | Shared by owner and staff: service jobs, stock (without cost prices), sales, cash, clock-in, stocktakes, Journal drafts |
| `jubeliwatch/jubeliwatch-owner-data` | **Private** | Owner only: buybacks, consignments, ID card photos, stock cost prices |

Customer data on the public site is encrypted. It can only be opened with the code plus the last 4 digits of the customer’s phone number. The POS refuses to work if either data repo is public.

> **Never** send a GitHub token to anyone (including Claude), photograph it, or put it in a file in this repo.

## First-time setup

### 1. Create the repos (signed in as `jubeliwatch`)
1. **jubeliwatch.github.io**: public. Push this folder to it, then go to **Settings → Pages**, choose **Deploy from a branch**, `main`, `/ (root)`.
2. **jubeliwatch-shop-data**: Private, tick **Add a README file**.
3. **jubeliwatch-owner-data**: Private, tick **Add a README file**.

### 2. Create a token on each device
Make the token **on the device that will use it** (phone first, laptop separately), so it never travels over WhatsApp or notes.

1. Open <https://github.com/settings/personal-access-tokens/new> (fine-grained token).
2. **Token name**: e.g. `Jubeli POS - phone`.
3. **Resource owner**: `jubeliwatch`. **Expiration**: 1 year (GitHub emails you before it expires), or no expiration if you will revoke it when a device is lost or sold.
4. **Repository access** → **Only select repositories** → all three repos above.
5. **Repository permissions → Contents → Read and write**. Leave everything else as it is.
6. **Generate token** and copy it (it starts with `github_pat_` and is shown only once).

### 3. Set up the POS on the device
1. Open <https://jubeliwatch.github.io/admin.html>.
2. Paste the token, create a **PIN** of at least 6 characters, repeat it, tap **Set up**.
3. Chrome menu ⋮ → **Add to Home screen** (iPhone: Share → Add to Home Screen) to open it like an app.

The PIN is asked every time the POS is opened or reloaded; the token only lives in memory while it is unlocked. Five wrong PINs in a row lock it for a while. Forgot the PIN? Create a new token and set up again.

### 4. Staff devices
Before setting up a staff device, save at least one service job from the owner’s device; until the shop repo has its first service record, staff devices show “Waiting for the owner”.

Staff tokens get access to **jubeliwatch.github.io** and **jubeliwatch-shop-data** only, never `jubeliwatch-owner-data`. Staff can use Checkout, Service, Stock, Sales, Cash, Clock-in and Stocktake, but cannot see cost prices, buybacks, consignments, ID photos, or the monthly report, and cannot delete records. This is enforced by GitHub access, not just hidden on screen.

## Daily use

- **Today**: cash in, tasks that need action (deposits due, late service jobs, uncollected watches, buyback deadlines), and the backup reminder.
- **Checkout**: tap items or service jobs ready to pay, then pay in full or take a deposit. Print a 58 mm receipt, save a PDF, or send it by WhatsApp.
- **Service**: “+ Watch in” creates a service code. Send the drop-off receipt, update the status, add before/after photos, and tell the customer when it’s ready. The customer follows it at `repair-status.html` with the code + last 4 phone digits.
- **Stock**: items with a price and the 🌐 label appear in the website collection about a minute after saving. **Share poster & offer** creates an Instagram/WhatsApp image.
- **Buyback**, **Consignment**: owner only. Terms are sent by WhatsApp and the customer replies **AGREE**.
- **Journal**: publishing creates `journal-<address>.html`, a card on the homepage, and a sitemap entry.
- **Cash**, **Clock-in**, **Stocktake**, **Monthly report**: under **More**.
- **Backup**: Service → **Download backup** (password-protected). Keep the password; it cannot be recovered.

WhatsApp buttons open a draft for you to check and send. Nothing is sent automatically.

## Changing shop settings
Edit `layanan-config.js` (on GitHub or here): shop name, address, opening hours, WhatsApp number, bank account, service price list (`katalogJasa`, price `0` = quote per job), movement types, condition grades, deposit/storage/warranty rules, and the terms printed on receipts and agreements. Save, wait about a minute, and reload the POS.

Watch rental is built in but hidden. To turn it on, set `SEWA_AKTIF = true` near the top of `admin.js` and add the `#sewa` link back to the menu in `admin.html`.

## Development
- Tests: `node --test` (Node 22+, no packages). They load the real code against an in-memory fake GitHub.
- Local demo with sample data, no real data touched: `node tests/server-admin.js 8783`, then open <http://127.0.0.1:8783/admin.html> with the test token `tok-owner` and any 6-digit PIN.
- After changing the list of cached files, bump `VERSION` in `sw.js`.

This codebase started as a copy of the AYRI POS. Internal names and code comments are still in Indonesian (`servis`, `stok`, `tebus`, …); everything customers and staff see is in English.
