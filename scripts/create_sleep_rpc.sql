CREATE OR REPLACE FUNCTION get_sleep_statistics(p_user_id UUID, days_limit INT DEFAULT 7)
RETURNS JSONB AS $$
DECLARE
    avg_hours NUMERIC;
    avg_quality NUMERIC;
    consistency NUMERIC;
    total_records INT;
    bedtime_variance NUMERIC;
    waketime_variance NUMERIC;
BEGIN
    WITH recent_records AS (
        SELECT 
            (EXTRACT(EPOCH FROM (wake_time - bedtime)) / 3600) AS hours_slept,
            sleep_quality,
            EXTRACT(EPOCH FROM bedtime::time) / 60 AS bedtime_minutes,
            EXTRACT(EPOCH FROM wake_time::time) / 60 AS waketime_minutes
        FROM public.sleep_records
        WHERE user_id = p_user_id AND date >= (now() - (days_limit || ' days')::interval)
    )
    SELECT 
        AVG(hours_slept),
        AVG(sleep_quality),
        COUNT(*),
        VAR_SAMP(bedtime_minutes),
        VAR_SAMP(waketime_minutes)
    INTO 
        avg_hours, 
        avg_quality, 
        total_records,
        bedtime_variance,
        waketime_variance
    FROM recent_records;

    IF total_records > 1 THEN
        consistency := GREATEST(0, 100 - (sqrt(COALESCE(bedtime_variance, 0)) + sqrt(COALESCE(waketime_variance, 0))) / 2);
    ELSE
        consistency := 100;
    END IF;

    RETURN jsonb_build_object(
        'mediaHorasSono', COALESCE(round(avg_hours, 1), 0),
        'mediaQualidade', COALESCE(round(avg_quality, 1), 0),
        'consistencia', COALESCE(round(consistency), 0),
        'totalRegistros', COALESCE(total_records, 0),
        'tendenciaHoras', 'estavel', 
        'tendenciaQualidade', 'estavel', 
        'registrosPorDia', '{}'::jsonb, 
        'melhorDia', 'N/A', 
        'piorDia', 'N/A', 
        'horaIdealDormir', 'N/A', 
        'horaIdealAcordar', 'N/A'
    );
END;
$$ LANGUAGE plpgsql;