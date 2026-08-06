/**
 * Read-only dry run for the wt → matdesk data import.
 *
 *   node scripts/wt-import-dryrun.mjs
 *
 * Writes NOTHING. Reads wt via WT_DATABASE_URL and reports what the import
 * would produce, plus every case where the planned rules would silently lose
 * money or data. Run this until the numbers look right, then run the importer.
 *
 * Planned import rules (decided 2026-08-06):
 *   settled_through_date  → flat '2026-08-31' (everything through August paid)
 *   joining_fee_paid      → carried from wt, so nobody is charged twice
 *   group_member.start_date → contract.start_date (membership began when the
 *                             member joined); end_date NULL (wt deleted rows on
 *                             removal, so every surviving row is active)
 */

import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: "../../apps/web/.env" });

const CUTOFF_MONTH = "2026-08-01";
const SETTLED_THROUGH = "2026-08-31";

/** Neon ships `sslrootcert=system`; pg-connection-string treats it as a file
 *  path and throws ENOENT. Same fix as drizzle.config.ts. */
function clean(url) {
  const u = new URL(url);
  u.searchParams.delete("sslrootcert");
  return u.toString();
}

function eur(cents) {
  return ((cents ?? 0) / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function heading(text) {
  console.log(`\n${"─".repeat(72)}\n${text}\n${"─".repeat(72)}`);
}

const wtUrl = process.env.WT_DATABASE_URL;
if (!wtUrl) {
  console.error("WT_DATABASE_URL is not set.");
  process.exit(1);
}

const wt = new pg.Client({ connectionString: clean(wtUrl), ssl: { rejectUnauthorized: true } });
await wt.connect();
const q = async (sql, params) => (await wt.query(sql, params)).rows;

// ── 1. What's there ─────────────────────────────────────────────────────────
heading("1. SOURCE ROW COUNTS");
const tables = [
  "organization",
  "user",
  "member",
  "club_member",
  "contract",
  "group",
  "group_member",
  "sepa_mandate",
  "invoice",
  "invoice_line",
  "credit_grant",
  "self_registration",
];
for (const t of tables) {
  const [{ n }] = await q(`select count(*)::int n from "${t}"`);
  console.log(`  ${t.padEnd(20)} ${String(n).padStart(6)}`);
}

// ── 2. Joining fee ──────────────────────────────────────────────────────────
heading("2. JOINING FEE — would anyone pay twice?");
const jf = await q(`
  select joining_fee_paid,
         count(*)::int n,
         coalesce(sum(coalesce(joining_fee_cents,0)),0)::bigint cents
    from contract group by 1 order by 1
`);
for (const r of jf) {
  console.log(`  joining_fee_paid=${String(r.joining_fee_paid).padEnd(6)} ${String(r.n).padStart(5)} contracts   fee total ${eur(Number(r.cents))}`);
}
const [{ cents: atRisk, n: atRiskN }] = await q(`
  select count(*)::int n, coalesce(sum(coalesce(joining_fee_cents,0)),0)::bigint cents
    from contract
   where joining_fee_paid = true and coalesce(joining_fee_cents,0) > 0
`);
console.log(`\n  Carrying the flag: ${atRiskN} contracts keep joining_fee_paid=true.`);
console.log(`  If the import DROPPED it (column defaults to false), matdesk would`);
console.log(`  re-charge ${eur(Number(atRisk))} across those contracts on the next run.`);

// ── 3. Settled-through vs actual invoice coverage ────────────────────────────
heading("3. SETTLED THROUGH — is everything really paid up to August?");
const statuses = await q("select status, count(*)::int n from invoice group by 1 order by 2 desc");
console.log(`  invoice status: ${statuses.map((r) => `${r.status}=${r.n}`).join("  ")}`);

const current = await q(`
  select coalesce(to_char(settled_through_date,'YYYY-MM-DD'),'(null)') v, count(*)::int n
    from contract group by 1 order by 1
`);
console.log(`\n  wt's current contract.settled_through_date:`);
for (const r of current) console.log(`    ${r.v.padEnd(12)} ${String(r.n).padStart(5)}`);

const coverage = await q(`
  with cov as (
    select c.id,
           c.start_date,
           max(i.billing_period_end) filter (where i.status <> 'void') as covered_to
      from contract c
      left join invoice i on i.contract_id = c.id
     group by c.id, c.start_date
  )
  select coalesce(to_char(covered_to,'YYYY-MM'),'(never billed)') bucket,
         count(*)::int n
    from cov group by 1 order by 1
`);
console.log(`\n  Actual non-void invoice coverage per contract (max billing_period_end):`);
for (const r of coverage) console.log(`    ${r.bucket.padEnd(16)} ${String(r.n).padStart(5)}`);

const [gap] = await q(
  `
  with cov as (
    select c.id, c.start_date,
           max(i.billing_period_end) filter (where i.status <> 'void') as covered_to
      from contract c left join invoice i on i.contract_id = c.id
     group by c.id, c.start_date
  )
  select count(*)::int total,
         count(*) filter (where covered_to is null and start_date <= $1)::int never_billed_started,
         count(*) filter (where covered_to is not null and covered_to < $2::date)::int short_coverage,
         count(*) filter (where start_date > $1)::int not_started_yet
    from cov
`,
  [CUTOFF_MONTH, SETTLED_THROUGH],
);
console.log(`\n  Against the planned flat '${SETTLED_THROUGH}':`);
console.log(`    contracts total .................. ${gap.total}`);
console.log(`    start after ${CUTOFF_MONTH} (fine, planner clamps to start) ... ${gap.not_started_yet}`);
console.log(`    started, but NEVER billed in wt .. ${gap.never_billed_started}`);
console.log(`    billed, but coverage < August .... ${gap.short_coverage}`);

// Only `active` and `cancelled` are billable in matdesk (plan.ts:34) — `ended`
// contracts never generate an invoice, so counting them as "unbilled" is
// meaningless. Segment before drawing any conclusion about lost revenue.
const billable = await q(
  `
  with cov as (
    select c.id, c.status, c.start_date, c.cancellation_effective_date,
           max(i.billing_period_end) filter (where i.status <> 'void') as covered_to
      from contract c left join invoice i on i.contract_id = c.id
     group by c.id, c.status, c.start_date, c.cancellation_effective_date
  )
  select status,
         count(*)::int n,
         count(*) filter (where covered_to is null)::int never_billed,
         count(*) filter (where covered_to is not null and covered_to < $1::date)::int short,
         count(*) filter (where cancellation_effective_date is not null
                            and cancellation_effective_date < $1::date)::int already_over
    from cov
   group by status order by 2 desc
`,
  [SETTLED_THROUGH],
);
console.log(`\n  Segmented by contract status (billable = active, cancelled):`);
for (const r of billable) {
  const mark = r.status === "active" || r.status === "cancelled" ? "BILLABLE" : "not billed";
  console.log(
    `    ${r.status.padEnd(10)} ${String(r.n).padStart(4)}  never_billed=${String(r.never_billed).padStart(4)}  coverage<Aug=${String(r.short).padStart(4)}  ended_before_Aug=${String(r.already_over).padStart(4)}  [${mark}]`,
  );
}

const [live] = await q(
  `
  select count(*)::int n,
         coalesce(sum((select coalesce(sum(gm.membership_price_cents),0)
                         from group_member gm where gm.member_id = c.member_id)),0)::bigint monthly_cents
    from contract c
   where c.status in ('active','cancelled')
     and c.start_date <= $1::date
     and (c.cancellation_effective_date is null or c.cancellation_effective_date >= $1::date)
`,
  [SETTLED_THROUGH],
);
console.log(`\n  Contracts matdesk would actually bill for September:`);
console.log(`    count ............... ${live.n}`);
console.log(`    monthly membership .. ${eur(Number(live.monthly_cents))}  (sum of current group prices)`);

// Exposure is bounded by contracts matdesk would actually bill — not by all 666.
// An earlier version of this script summed every contract including the 446
// `ended` ones and produced a ~€105k figure that was pure noise.
const [exposure] = await q(
  `
  with cov as (
    select c.id, c.member_id, c.start_date, c.cancellation_effective_date,
           max(i.billing_period_end) filter (where i.status <> 'void') as covered_to
      from contract c left join invoice i on i.contract_id = c.id
     where c.status in ('active','cancelled')
     group by c.id, c.member_id, c.start_date, c.cancellation_effective_date
  )
  select count(*)::int n,
         coalesce(sum(
           greatest(0,
             (date_part('year',$1::date) - date_part('year', greatest(
                date_trunc('month', coalesce(covered_to + interval '1 day', start_date))::date, start_date))) * 12 +
             (date_part('month',$1::date) - date_part('month', greatest(
                date_trunc('month', coalesce(covered_to + interval '1 day', start_date))::date, start_date))) + 1)
         ),0)::bigint months,
         coalesce(sum(
           greatest(0,
             (date_part('year',$1::date) - date_part('year', greatest(
                date_trunc('month', coalesce(covered_to + interval '1 day', start_date))::date, start_date))) * 12 +
             (date_part('month',$1::date) - date_part('month', greatest(
                date_trunc('month', coalesce(covered_to + interval '1 day', start_date))::date, start_date))) + 1)
           * (select coalesce(sum(gm.membership_price_cents),0) from group_member gm where gm.member_id = cov.member_id)
         ),0)::bigint cents
    from cov
   where (covered_to is null or covered_to < $1::date)
     and start_date <= $1::date
     and (cancellation_effective_date is null or cancellation_effective_date >= $1::date)
`,
  [SETTLED_THROUGH],
);
console.log(`\n  Exposure if the "paid through August" assertion is wrong:`);
console.log(`    billable contracts with no August invoice in wt .. ${exposure.n}`);
console.log(`    unbilled member-months they represent ............ ${exposure.months}`);
console.log(`    ≈ value written off by flat-setting .............. ${eur(Number(exposure.cents))}`);
console.log(`    (Membership fees only. wt's invoice table has ZERO August coverage,`);
console.log(`     so it cannot corroborate the assertion either way — flat-setting`);
console.log(`     imports it as fact.)`);


// ── 4. Group memberships ────────────────────────────────────────────────────
heading("4. GROUP MEMBERSHIPS — deriving start_date from contract.start_date");
const [gm] = await q(`
  select count(*)::int total,
         count(*) filter (where ct.id is null)::int no_contract,
         count(*) filter (where ct.start_date is null)::int null_start
    from group_member gm
    left join contract ct on ct.member_id = gm.member_id
`);
console.log(`  group_member rows ................ ${gm.total}`);
console.log(`  with NO contract (needs fallback)  ${gm.no_contract}`);
console.log(`  contract with null start_date ....  ${gm.null_start}`);

const [cmp] = await q(`
  select count(*) filter (where gm.created_at::date = ct.start_date)::int same,
         count(*) filter (where gm.created_at::date > ct.start_date)::int created_later,
         count(*) filter (where gm.created_at::date < ct.start_date)::int created_earlier
    from group_member gm join contract ct on ct.member_id = gm.member_id
`);
console.log(`\n  created_at vs contract.start_date: same=${cmp.same} later=${cmp.created_later} earlier=${cmp.created_earlier}`);
const bulk = await q(`
  select gm.created_at::date d, count(*)::int n
    from group_member gm group by 1 order by 2 desc limit 5
`);
console.log(`  top created_at dates (bulk-insert check):`);
for (const r of bulk) console.log(`    ${r.d.toISOString().slice(0, 10)}  ${r.n}`);
console.log(`\n  → Using contract.start_date, every surviving row becomes an OPEN`);
console.log(`    spell (end_date NULL). Pre-import group history is not recoverable`);
console.log(`    from wt (removals were DELETEs); matdesk accrues history onward.`);

// ── 5. Things that don't map ────────────────────────────────────────────────
heading("5. UNMAPPABLE / NEW-SIDE-ONLY");
const [cancelled] = await q(
  `select count(*) filter (where cancelled_at is not null)::int n,
          count(*) filter (where cancellation_effective_date < $1::date)::int fully_ended
     from contract`,
  [SETTLED_THROUGH],
);
console.log(`  cancelled contracts .............. ${cancelled.n} (of which already ended: ${cancelled.fully_ended})`);
const cstat = await q("select status, count(*)::int n from contract group by 1 order by 2 desc");
console.log(`  contract status: ${cstat.map((r) => `${r.status}=${r.n}`).join("  ")}`);
const [mand] = await q(
  `select count(*)::int total, count(*) filter (where is_active)::int active from sepa_mandate`,
);
console.log(`  sepa_mandate ..................... ${mand.total} (active ${mand.active})`);
console.log(`  matdesk-only, nothing to import .. two_factor, organization.updated_at`);
console.log(`  wt-only, dropped ................. user.hide_sensitive_informatoin (typo col)`);

heading("DONE — nothing was written");
await wt.end();
