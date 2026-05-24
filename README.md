# TrustLoop PayFlow

TrustLoop PayFlow is a Stellar-powered payment cockpit designed for modern operators, OFW remittance workflows, and SME payout operations.

## Problem
Filipino operators often need a faster, clearer way to move money, confirm status, and reduce operational friction in payout workflows.

## Solution
TrustLoop PayFlow combines:
- Freighter-first wallet connectivity
- Stellar testnet transaction submission
- Payment activity tracking
- A premium dashboard for review and operations

## What’s included
- Wallet connect / reconnect flow
- Payment form with validation
- Payment history with search, filter, and sort
- Dashboard insights for volume, confirmations, pending payments, and activity trends
- Local activity persistence for fast demos

## Run locally
```bash
npm install
npm run dev
```

Open http://localhost:3000 to view the app.

## Demo storyline
1. Connect Freighter.
2. Create a payout with recipient, amount, and memo.
3. Review wallet status and transaction confirmation.
4. Use the dashboard to inspect activity, filters, and operational insights.

## Hackathon fit
- Real-world impact for OFW remittances and SME payouts
- Stellar-native payment workflow
- Demo-friendly, easy-to-explain MVP

## Build
```bash
npm run build
```

## Notes
The current MVP focuses on the payment cockpit, transaction overview, and operational visibility. The next iteration can add richer analytics, export, and deeper remittance-focused flows.
