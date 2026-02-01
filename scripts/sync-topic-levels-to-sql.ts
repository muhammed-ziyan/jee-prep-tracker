/**
 * Generates SQL to sync topic levels (Class 11 / Class 12) from JEE_MAIN_SYLLABUS.
 * Ensures each topic has exactly one level (is_class_11 XOR is_class_12), matching student view filtering.
 * Run: npx tsx scripts/sync-topic-levels-to-sql.ts > supabase/migrations/20250201000006_sync_topic_levels.sql
 */
import { JEE_MAIN_SYLLABUS } from "../lib/jee-syllabus-data";

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

function main() {
  const out: string[] = [];
  out.push("-- Sync topic levels from canonical JEE syllabus (one level per topic, same as student view).");
  out.push("-- Generated from lib/jee-syllabus-data.ts (getScope / JEE_MAIN_SYLLABUS).");
  out.push("");

  let unitId = 0;
  const valueRows: string[] = [];

  for (const sub of JEE_MAIN_SYLLABUS) {
    for (const unit of sub.units) {
      unitId++;
      for (const t of unit.topics) {
        const c11 = t.isClass11 ? "true" : "false";
        const c12 = t.isClass12 ? "true" : "false";
        valueRows.push(`    (${unitId}, '${esc(t.name)}', ${c11}, ${c12})`);
      }
    }
  }

  out.push("UPDATE topics t SET");
  out.push("  is_class_11 = v.is_class_11,");
  out.push("  is_class_12 = v.is_class_12");
  out.push("FROM (VALUES");
  out.push(valueRows.join(",\n"));
  out.push(") AS v(unit_id, name, is_class_11, is_class_12)");
  out.push("WHERE t.unit_id = v.unit_id AND t.name = v.name;");
  out.push("");
  out.push("-- Fix any remaining topics with both true (e.g. custom topics): set to Class 11 only.");
  out.push("UPDATE topics SET is_class_11 = true, is_class_12 = false");
  out.push("WHERE is_class_11 = true AND is_class_12 = true;");

  console.log(out.join("\n"));
}

main();
