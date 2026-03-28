# Fairway Backend

## Draw Prize Pool Configuration

The draw system calculates the total prize pool from active subscribers based on subscription plan.

Configure these environment variables in `.env`:

- `DRAW_MONTHLY_POOL_CONTRIBUTION`: Monthly-plan user contribution per draw cycle.
- `DRAW_YEARLY_POOL_CONTRIBUTION`: Yearly-plan user contribution per draw cycle.

Current example:

```env
DRAW_MONTHLY_POOL_CONTRIBUTION=10
DRAW_YEARLY_POOL_CONTRIBUTION=8.33
```

## How Prize Pool Is Built

For each active, eligible subscriber:

- Monthly plan: adds `DRAW_MONTHLY_POOL_CONTRIBUTION`
- Yearly plan: adds `DRAW_YEARLY_POOL_CONTRIBUTION`

Then tier distribution is applied automatically:

- 5-match: 40% (with rollover when unclaimed)
- 4-match: 35%
- 3-match: 25%

## Draft to Publish Workflow

- Running monthly draw creates a `draft` draw and does not apply payouts.
- Publishing the draw applies payouts from stored `winnerEntries` and marks draw as `published`.
- A new draw cannot be created while any draft draw exists.

## Run Commands

```bash
npm run dev
npm start
```
