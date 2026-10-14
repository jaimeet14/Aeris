# Aeris

A ledger for money between friends. Log what you lent or borrowed, why, and when —
and let the balance take care of itself.

Aeris **records that money moved. It never moves money.** No payments, no bank
connections, no interest, no lending. It is a notebook that does the arithmetic.

## Where this is

Milestone 2 of six: the app still runs entirely on the phone. No account, no
server, no network. What works today:

- Record what you lent and what you borrowed, with an occasion, a note, and a timestamp
- A per-person ledger with a running balance
- Part payments and settle-in-full, allocated oldest-debt-first
- Currency chosen on first launch from a list, changeable later from Home
- **Pick people from your contacts** (M2). A priming screen explains what is read
  before the system asks, and skipping it is fine — typing a name still works.
  Numbers are stored in E.164, so the same friend saved two ways is one ledger.
- **Your own occasions** (M2) alongside the presets — "Goa trip", "Gym", whatever
  you lend for. Adding one that already exists, in any case, reuses it.
- **Activity** (M2): the time log across every person, grouped by day, in the
  order Aeris was told. When the money moved at a different time it says so.

Not built yet: the store release (M3), sync (M4), and two-sided confirmed
ledgers with the inbox (M5).

### Contacts never leave the phone

`src/contacts/device.ts` is the only file that touches the address book. It reads
names and numbers, never writes (`WRITE_CONTACTS` is blocked in `app.json`), and
nothing it returns is sent anywhere — there is nowhere to send it until M4.

A number typed without a `+` is read as belonging to the country of your
currency (INR → +91). EUR spans too many countries to guess, so with EUR only
numbers written with a `+` are kept; the person is still saved, just without one.

## Running it

```sh
npm install
npm start          # then scan the QR code with Expo Go
```

`expo-sqlite` and the rest of the dependency list all run inside **Expo Go**, so
there is nothing to build and nothing to pay for while iterating.

```sh
npm test           # domain tests — money, balances, allocation, phones, activity
npm run typecheck
```

## How it is put together

```
src/
  domain/     pure TypeScript, no React, no SQL — the part that must be right
  contacts/   the address-book adapter, read-only
  db/         SQLite schema, migrations, repository functions
  screens/    one file per screen
  ui/         shared components and the Aeris mark
  theme/      colour and type tokens
```

`domain/` is deliberately free of every dependency so it can be tested in
milliseconds and reused unchanged on the server at M4.

### Four rules the code will not bend

1. **Money is an integer count of minor units.** `420000` is ₹4,200.00. No float
   ever touches a balance.
2. **Two timestamps, never one.** `occurredAt` is when the money moved and the
   user may set it. `recordedAt` is when Aeris was told, and never changes.
3. **Balances are derived.** `ledgerBalance()` sums the entries. Any stored
   balance is a cache; when they disagree, the sum wins.
4. **One currency per ledger, never converted.** Your setting is only the default
   for *new* ledgers, so changing it never rewrites what is recorded.

### Entries are append-only

Nothing is edited in place. A correction is a reversing entry; a repayment is a
new entry pointing at the one it settles. That is what keeps the time log honest,
and it is what makes two-sided sync tractable at M5.

`sync_outbox` exists in the schema from the first migration. It stays empty until
M4 — adding it later would mean migrating live data.

## Design

Wireframes, architecture and the security model: the Aeris blueprint.
Screens and identity: the Aeris design canvas.

## Licence

Private. All rights reserved.

## Getting it onto a phone properly

`npm start` streams the app from your computer through Expo Go, which is fine
while iterating but stops the moment you close the terminal. To carry Aeris
around for a week, build a standalone APK — free, and the laptop stays off:

```sh
npm install -g eas-cli
eas login                                   # free account from expo.dev
eas build --platform android --profile preview
```

EAS builds in the cloud and hands back a download link. Open it on the phone,
install, done. The `production` profile produces the `.aab` that Play Console
wants when it is time to ship.

Note that the standalone app and Expo Go keep **separate databases** — anything
recorded while testing through Expo Go does not carry across. Start real use in
the installed build.

**Install the new APK over the old one — never uninstall first.** Android keeps
the app's data when the new build is signed with the same key, and EAS signs
every build with the same stored keystore. Uninstalling wipes everything recorded.

## Shipping changes without a new APK

Builds include `expo-updates`, so a change that is JavaScript only reaches the
phone over the air: the app downloads it in the background and uses it from the
next launch. One-time setup, on the machine you build from:

```sh
eas update:configure     # writes the project id and update URL into app.json
git add app.json && git commit -m "Point expo-updates at the EAS project"
```

Then build the APK once more (`eas build --platform android --profile preview`)
and install it over the old one. After that:

```sh
eas update --channel preview --message "what changed"
```

Each build profile listens on the channel of the same name (see `eas.json`).

`runtimeVersion` uses the **fingerprint** policy: it is a hash of the native
side of the app. An update only lands on builds with the same fingerprint, so a
change that adds a native module — contacts at M2, push notifications at M5 —
can never be pushed onto an APK that lacks it. Those changes still need a new
build; EAS says so when the fingerprint no longer matches.
