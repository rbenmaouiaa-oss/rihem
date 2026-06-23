ALTER TABLE attendance_logs DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    emp RECORD;
    d DATE := '2026-01-01';
    today DATE := CURRENT_DATE;
BEGIN
    FOR emp IN SELECT id FROM users LOOP
        d := '2026-01-01';
        WHILE d < today LOOP
            IF EXTRACT(DOW FROM d) BETWEEN 1 AND 5 AND random() > 0.1 THEN
                INSERT INTO attendance_logs (employee_id, date, entree1, sortie1, entree2, sortie2, status)
                VALUES (
                    emp.id, d,
                    to_char(TIME '07:30' + random() * INTERVAL '90 min', 'HH24:MI'),
                    to_char(TIME '12:00' + random() * INTERVAL '30 min', 'HH24:MI'),
                    to_char(TIME '13:00' + random() * INTERVAL '30 min', 'HH24:MI'),
                    to_char(TIME '16:00' + random() * INTERVAL '2 hours', 'HH24:MI'),
                    CASE WHEN random() < 0.15 THEN 'late' ELSE 'present' END
                );
            END IF;
            d := d + 1;
        END LOOP;
    END LOOP;
END $$;
