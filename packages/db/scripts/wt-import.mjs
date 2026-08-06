/**
 * wt → matdesk data import.
 *
 *   node scripts/wt-import.mjs                 # dry run (default), writes nothing
 *   node scripts/wt-import.mjs --execute       # actually import
 *   node scripts/wt-import.mjs --execute --with-invoices
 *   node scripts/wt-import.mjs --execute --force   # allow non-empty target
 *
 * Reads wt via WT_DATABASE_URL, writes matdesk via DATABASE_URL. The whole
 * import runs in ONE transaction on the target — it either lands completely or
 * not at all. Run `wt-import-dryrun.mjs` first for the analysis behind the rules.
 *
 * ── Import rules (decided 2026-08-06) ──────────────────────────────────────
 *
 * contract.settled_through_date → flat '2026-08-31'
 *     Everything through August was collected. wt's invoice table can't
 *     corroborate this (it has zero August coverage), so it's imported as fact.
 *     plan.ts:84 takes max(settledThrough+1month, startDate), so contracts
 *     starting later are unaffected — no CASE needed.
 *
 * contract.joining_fee_paid → carried verbatim
 *     637 true / 29 false in wt. Dropping it would re-charge €41,972, because
 *     the column defaults to false.
 *
 * group_member → start_date = contract.start_date, end_date = NULL
 *     matdesk's group_member is temporal (surrogate id + spells); wt's is a
 *     plain composite-key join table. `created_at` was rejected as the start:
 *     193 of 241 rows share two timestamps (2026-02-27, 2026-03-21), i.e. wt's
 *     own bulk import, not when anyone joined. Every surviving wt row is an
 *     active membership (removals were DELETEs), so all spells are open.
 *
 * invoice / invoice_line → SKIPPED unless --with-invoices
 *     Not needed for correctness: settled_through already blocks re-billing,
 *     and all 220 billable contracts are yearly_fee_mode='january' (next
 *     trigger Jan 2027, a genuinely new cycle), so there's no yearly-fee
 *     double-charge to guard against. Excluded by default because the data is
 *     partial — 250 finalized invoices covering May–July for 121 of 666
 *     contracts — which would render matdesk's revenue statistics misleading.
 *     wt's own April cutover likewise deleted all invoices to start clean.
 *
 * session / verification → skipped (users re-authenticate)
 * organization_role → empty in wt
 * two_factor → matdesk-only, nothing to import
 * user.hide_sensitive_informatoin → dropped (not in matdesk's schema)
 */

import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: "../../apps/web/.env" });

const SETTLED_THROUGH = "2026-08-31";
const EXECUTE = process.argv.includes("--execute");
const WITH_INVOICES = process.argv.includes("--with-invoices");
const FORCE = process.argv.includes("--force");
const BATCH = 250;

/** Neon ships `sslrootcert=system`; pg-connection-string reads it as a file
 *  path and throws ENOENT. Same fix as drizzle.config.ts. */
function clean(url) {
  const u = new URL(url);
  u.searchParams.delete("sslrootcert");
  return u.toString();
}

/**
 * Tables in dependency order. `columns: "shared"` copies the intersection of
 * source and target columns — so a schema tweak on either side doesn't silently
 * drop data, it just stops copying a column that no longer exists on both.
 * `select` overrides the read query for tables needing transformation.
 */
const PLAN = [
  { table: "user", columns: "shared" },
  { table: "account", columns: "shared" },
  { table: "organization", columns: "shared", defaults: { updated_at: "created_at" } },
  { table: "member", columns: "shared" },
  { table: "invitation", columns: "shared" },
  { table: "passkey", columns: "shared" },
  { table: "group", columns: "shared" },
  { table: "club_member", columns: "shared" },
  {
    table: "contract",
    columns: "shared",
    // settled_through_date is asserted, not copied.
    literals: { settled_through_date: SETTLED_THROUGH },
  },
  { table: "sepa_mandate", columns: "shared" },
  {
    table: "group_member",
    // Temporal conversion: matdesk needs id/start_date/end_date, none of which
    // exist in wt. id comes from the target's own default (gen_random_uuid()).
    explicit: {
      targetColumns: [
        "group_id",
        "member_id",
        "membership_price_cents",
        "start_date",
        "end_date",
        "created_at",
        "updated_at",
      ],
      sql: `
        select gm.group_id,
               gm.member_id,
               gm.membership_price_cents,
               ct.start_date          as start_date,
               null::date             as end_date,
               gm.created_at,
               gm.updated_at
          from group_member gm
          join contract ct on ct.member_id = gm.member_id
      `,
    },
  },
  { table: "credit_grant", columns: "shared" },
  { table: "self_registration", columns: "shared" },
  { table: "invoice", columns: "shared", onlyWithInvoices: true },
  { table: "invoice_line", columns: "shared", onlyWithInvoices: true },
];

async function columnsOf(client, table) {
  const { rows } = await client.query(
    `select column_name from information_schema.columns
      where table_schema='public' and table_name=$1`,
    [table],
  );
  return new Set(rows.map((r) => r.column_name));
}

/**
 * json/jsonb columns need special handling on the way back in: pg returns them
 * as parsed JS values, and re-binding a parsed *array* makes pg emit Postgres
 * array-literal syntax (`{...}`) instead of JSON, which the server rejects with
 * "invalid input syntax for type json". Objects happen to survive; arrays don't.
 * Stringify explicitly so both behave.
 */
async function jsonColumnsOf(client, table) {
  const { rows } = await client.query(
    `select column_name from information_schema.columns
      where table_schema='public' and table_name=$1 and udt_name in ('json','jsonb')`,
    [table],
  );
  return new Set(rows.map((r) => r.column_name));
}

async function tableExists(client, table) {
  const { rows } = await client.query("select to_regclass($1) r", [`public.${table}`]);
  return Boolean(rows[0].r);
}

function ident(name) {
  return `"${name.replace(/"/g, '""')}"`;
}

const srcUrl = process.env.WT_DATABASE_URL;
const dstUrl = process.env.DATABASE_URL;
if (!srcUrl || !dstUrl) {
  console.error("Need both WT_DATABASE_URL (source) and DATABASE_URL (target).");
  process.exit(1);
}

const src = new pg.Client({ connectionString: clean(srcUrl), ssl: { rejectUnauthorized: true } });
const dst = new pg.Client({ connectionString: clean(dstUrl), ssl: { rejectUnauthorized: true } });
await src.connect();
await dst.connect();

console.log(`\nmode: ${EXECUTE ? "EXECUTE (writes)" : "DRY RUN (no writes)"}`);
console.log(`invoices: ${WITH_INVOICES ? "included" : "skipped"}\n`);

// ── Guard: refuse to import into a populated target ─────────────────────────
{
  const [{ n }] = (await dst.query("select count(*)::int n from club_member")).rows;
  if (n > 0 && !FORCE) {
    console.error(
      `Target already has ${n} club_member rows. Re-running would duplicate data.\n` +
        `Wipe it (DROP SCHEMA public CASCADE; CREATE SCHEMA public; then pnpm db:migrate)\n` +
        `or pass --force if you know what you're doing.`,
    );
    await src.end();
    await dst.end();
    process.exit(1);
  }
}

const results = [];

if (EXECUTE) await dst.query("begin");
try {
  for (const step of PLAN) {
    const { table } = step;
    if (step.onlyWithInvoices && !WITH_INVOICES) {
      results.push({ table, source: null, copied: "skipped (--with-invoices)" });
      continue;
    }
    if (!(await tableExists(src, table))) {
      results.push({ table, source: null, copied: "skipped (absent in source)" });
      continue;
    }

    let targetColumns;
    let selectSql;

    if (step.explicit) {
      targetColumns = step.explicit.targetColumns;
      selectSql = step.explicit.sql;
    } else {
      const [srcCols, dstCols] = await Promise.all([columnsOf(src, table), columnsOf(dst, table)]);
      const shared = [...dstCols].filter((c) => srcCols.has(c));
      const literals = step.literals ?? {};
      const defaults = step.defaults ?? {};

      // Columns matdesk has, wt lacks, that we can fill from another column.
      const filled = Object.keys(defaults).filter((c) => dstCols.has(c) && !srcCols.has(c));
      targetColumns = [...new Set([...shared, ...filled])];

      selectSql = `select ${targetColumns
        .map((c) => {
          if (c in literals) return `'${literals[c]}'::date as ${ident(c)}`;
          if (filled.includes(c)) return `${ident(defaults[c])} as ${ident(c)}`;
          return ident(c);
        })
        .join(", ")} from ${ident(table)}`;

      const dropped = [...srcCols].filter((c) => !dstCols.has(c));
      if (dropped.length) {
        console.log(`  note: ${table} — source columns not in matdesk, dropped: ${dropped.join(", ")}`);
      }
    }

    const { rows } = await src.query(selectSql);
    if (!EXECUTE) {
      results.push({ table, source: rows.length, copied: "(dry run)" });
      continue;
    }
    if (rows.length === 0) {
      results.push({ table, source: 0, copied: 0 });
      continue;
    }

    const jsonCols = await jsonColumnsOf(dst, table);

    let copied = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH);
      const params = [];
      const tuples = chunk.map((row) => {
        const placeholders = targetColumns.map((c) => {
          const value = row[c];
          params.push(
            jsonCols.has(c) && value !== null && typeof value !== "string"
              ? JSON.stringify(value)
              : value,
          );
          return `$${params.length}`;
        });
        return `(${placeholders.join(",")})`;
      });
      const sql = `insert into ${ident(table)} (${targetColumns.map(ident).join(",")}) values ${tuples.join(",")}`;
      const res = await dst.query(sql, params);
      copied += res.rowCount;
    }
    results.push({ table, source: rows.length, copied });
  }

  if (EXECUTE) {
    await dst.query("commit");
    console.log("\ntransaction committed.");
  }
} catch (error) {
  if (EXECUTE) {
    await dst.query("rollback");
    console.error("\nROLLED BACK — nothing was written.");
  }
  console.error(error.message);
  await src.end();
  await dst.end();
  process.exit(1);
}

// ── Report ──────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(64)}`);
console.log(`${"table".padEnd(22)}${"source".padStart(9)}${"copied".padStart(12)}`);
console.log("─".repeat(64));
for (const r of results) {
  console.log(
    `${r.table.padEnd(22)}${String(r.source ?? "-").padStart(9)}${String(r.copied).padStart(12)}`,
  );
}
console.log("─".repeat(64));

// ── Reconciliation ──────────────────────────────────────────────────────────
if (EXECUTE) {
  console.log("\nRECONCILIATION (source vs target)");
  const checks = [
    ["club_member rows", "select count(*)::int v from club_member"],
    ["contract rows", "select count(*)::int v from contract"],
    ["group_member rows", "select count(*)::int v from group_member"],
    ["sepa_mandate rows", "select count(*)::int v from sepa_mandate"],
    [
      "joining_fee_paid=true",
      "select count(*)::int v from contract where joining_fee_paid = true",
    ],
    [
      "sum joining_fee_cents",
      "select coalesce(sum(joining_fee_cents),0)::bigint v from contract",
    ],
    [
      "sum membership prices",
      "select coalesce(sum(membership_price_cents),0)::bigint v from group_member",
    ],
    [
      "active contracts",
      "select count(*)::int v from contract where status = 'active'",
    ],
  ];
  let mismatches = 0;
  for (const [label, sql] of checks) {
    const [{ v: a }] = (await src.query(sql)).rows;
    const [{ v: b }] = (await dst.query(sql)).rows;
    const ok = String(a) === String(b);
    if (!ok) mismatches++;
    console.log(`  ${ok ? "OK  " : "DIFF"} ${label.padEnd(24)} source=${a}  target=${b}`);
  }

  const [st] = (
    await dst.query(
      `select count(*)::int total,
              count(*) filter (where settled_through_date = $1::date)::int settled
         from contract`,
      [SETTLED_THROUGH],
    )
  ).rows;
  console.log(`  ${st.settled === st.total ? "OK  " : "DIFF"} settled_through=${SETTLED_THROUGH}   ${st.settled}/${st.total}`);

  const [sp] = (
    await dst.query(
      `select count(*)::int total,
              count(*) filter (where end_date is null)::int open,
              count(*) filter (where start_date is null)::int null_start
         from group_member`,
    )
  ).rows;
  console.log(`  ${sp.open === sp.total && sp.null_start === 0 ? "OK  " : "DIFF"} group_member spells      open=${sp.open}/${sp.total} null_start=${sp.null_start}`);

  console.log(mismatches === 0 ? "\nall count/sum checks matched." : `\n${mismatches} MISMATCH(ES) — investigate before trusting this import.`);
}

await src.end();
await dst.end();
