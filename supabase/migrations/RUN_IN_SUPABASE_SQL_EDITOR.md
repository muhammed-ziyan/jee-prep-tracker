# Run migrations in Supabase

If you use **Supabase Dashboard**: run the migrations in order in the SQL Editor.

1. **First**: run `20250131000000_syllabus_scope.sql` (adds `is_class_11`, `is_class_12` to topics).
2. **Second**: run `20250131000001_reseed_syllabus_split_topics.sql` (clears old units/topics so the app reseeds with split topics).
3. For **Tests** (mock_tests): run `20250131000005_mock_tests_schema_fix.sql`, then run **`../reload_schema.sql`** so PostgREST picks up the table.
4. For **per-subject max score** (tests with multiple subjects): run `20250131000006_mock_test_subject_max_score.sql` (adds `max_score` to `mock_test_subjects`).

After that, open your app and go to the **Syllabus** page. The next request to `/api/syllabus` will reseed the database with one topic per phrase (split by comma/semicolon) and Class 11/Class 12 scope.

**If you get "Could not find the 'title' (or other) column of 'mock_tests' in the schema cache"**: PostgREST's schema cache is stale. In the SQL Editor run **`reload_schema.sql`** (in the `supabase` folder), or run: `NOTIFY pgrst, 'reload schema';` Then try the request again.

To use the CLI instead: `supabase link` (with your project ref), then `npx supabase db push`.
