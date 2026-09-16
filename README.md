# Aeris

A ledger for money between friends. Log what you lent or borrowed, why, and when —
and let the balance take care of itself.

Aeris **records that money moved. It never moves money.** No payments, no bank
connections, no interest, no lending. It is a notebook that does the arithmetic.

## Where this is

Milestone 1 of six: the app runs entirely on the phone. No account, no server,
no network. What works today:

- Record what you lent and what you borrowed, with an occasion, a note, and a timestamp
- A per-person ledger with a running balance
- Part payments and settle-in-full, allocated oldest-debt-first
- Currency chosen on first launch from a list, changeable later

Not built yet: contacts matching (M2), the store release (M3), sync (M4), and
two-sided confirmed ledgers with the inbox (M5).

## Running it

```sh
npm install
npm start          # then scan the QR code with Expo Go
```

`expo-sqlite` and the rest of the dependency list all run inside **Expo Go**, so
there is nothing to build and nothing to pay for while iterating.

```sh
npm test           # domain tests — money, balances, allocation
npm run typecheck
```

## How it is put together

```
src/
  domain/     pure TypeScript, no React, no SQL — the part that must be right
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
