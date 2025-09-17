CREATE OR REPLACE FUNCTION get_lazer_statistics(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    total_atividades INT;
    total_minutos INT;
    fav_categoria TEXT;
BEGIN
    SELECT 
        COUNT(*),
        COALESCE(SUM(duracao_minutos), 0)
    INTO total_atividades, total_minutos
    FROM public.atividades_lazer
    WHERE user_id = p_user_id;

    SELECT categoria
    INTO fav_categoria
    FROM public.atividades_lazer
    WHERE user_id = p_user_id
    GROUP BY categoria
    ORDER BY COUNT(*) DESC
    LIMIT 1;

    RETURN jsonb_build_object(
        'atividadesRealizadas', total_atividades,
        'tempoTotalMinutos', total_minutos,
        'categoriaFavorita', fav_categoria
    );
END;
$$ LANGUAGE plpgsql;