SELECT routine_name, routine_type, data_type
FROM information_schema.routines
WHERE specific_schema = 'public';