/**
 * Generates SQL to insert the full JEE syllabus into Supabase.
 * Run: npx tsx scripts/seed-syllabus-to-sql.ts > supabase/migrations/20250201000003_seed_jee_syllabus.sql
 * Or: node --loader tsx scripts/seed-syllabus-to-sql.ts
 */
import { JEE_MAIN_SYLLABUS } from "../lib/jee-syllabus-data";

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

function main() {
  const out: string[] = [];
  out.push("-- Full JEE Main syllabus: subjects, units, topics. Run only when subjects table is empty.");
  out.push("DO $$");
  out.push("BEGIN");
  out.push("  IF (SELECT COUNT(*) FROM subjects) = 0 THEN");
  out.push("");

  let unitId = 0;
  const unitRows: string[] = [];
  const topicRows: string[] = [];

  const subjectIdByName: Record<string, number> = {};
  JEE_MAIN_SYLLABUS.forEach((sub, idx) => {
    subjectIdByName[sub.name] = idx + 1;
  });

  // Subjects
  const subjectValues = JEE_MAIN_SYLLABUS.map(
    (s, i) => `(${i + 1}, '${esc(s.name)}', '${esc(s.color)}')`
  ).join(",\n    ");
  out.push("    INSERT INTO subjects (id, name, color) VALUES");
  out.push("    " + subjectValues + ";");
  out.push("    PERFORM setval('subjects_id_seq', (SELECT MAX(id) FROM subjects));");
  out.push("");

  // Units and topics
  for (const sub of JEE_MAIN_SYLLABUS) {
    const subjectId = subjectIdByName[sub.name];
    for (const unit of sub.units) {
      unitId++;
      unitRows.push(`    (${unitId}, ${subjectId}, '${esc(unit.name)}', ${unit.order})`);
      for (const t of unit.topics) {
        topicRows.push(
          `    (${unitId}, '${esc(t.name)}', ${t.order}, ${t.isImportant}, NULL, ${t.isClass11}, ${t.isClass12})`
        );
      }
    }
  }

  out.push("    INSERT INTO units (id, subject_id, name, \"order\") VALUES");
  out.push(unitRows.join(",\n"));
  out.push("    ;");
  out.push("    PERFORM setval('units_id_seq', (SELECT MAX(id) FROM units));");
  out.push("");

  out.push("    INSERT INTO topics (unit_id, name, \"order\", is_important, weightage, is_class_11, is_class_12) VALUES");
  out.push(topicRows.join(",\n"));
  out.push("    ;");
  out.push("    PERFORM setval('topics_id_seq', (SELECT MAX(id) FROM topics));");
  out.push("");
  out.push("  END IF;");
  out.push("END $$;");

  console.log(out.join("\n"));
}

main();
