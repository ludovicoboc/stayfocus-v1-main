-- Script para popular o banco de dados com dados de teste

-- UUID do usuário de teste gerado
-- ID: b0000a73-1415-4e00-8b17-07bc82c6165d

-- MÓDULO DE LAZER

-- 1. Inserir sugestões de descanso (tabela pública, sem user_id)
-- A política de RLS permite que isso seja feito apenas por um admin (service_role)
-- Assumindo que este script será executado com privilégios de admin.
INSERT INTO public.sugestoes_descanso (id, nome, descricao, categoria, duracao_sugerida_minutos, beneficios) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Caminhada Leve', 'Uma caminhada de 15 minutos pelo bairro para relaxar a mente.', 'Atividade Física', 15, '{"Melhora a circulação", "Reduz o estresse"}'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Meditação Guiada', 'Sessão de meditação focada na respiração e no presente.', 'Relaxamento', 10, '{"Aumenta o foco", "Promove a calma"}'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Ler um Capítulo de Livro', 'Desconecte-se das telas e mergulhe em uma nova história.', 'Hobby', 20, '{"Estimula a criatividade", "Expande o vocabulário"}');

-- 2. Inserir atividades de lazer realizadas pelo usuário de teste
INSERT INTO public.atividades_lazer (user_id, nome, categoria, duracao_minutos, data_realizacao, avaliacao, observacoes) VALUES
('b0000a73-1415-4e00-8b17-07bc82c6165d', 'Jogou videogame', 'Hobby', 60, CURRENT_DATE - 1, 5, 'Terminei a fase final.'),
('b0000a73-1415-4e00-8b17-07bc82c6165d', 'Caminhada no parque', 'Atividade Física', 30, CURRENT_DATE - 2, 4, 'Estava um dia ensolarado.');

-- 3. Favoritar uma sugestão para o usuário de teste
INSERT INTO public.sugestoes_favoritas (user_id, sugestao_id) VALUES
('b0000a73-1415-4e00-8b17-07bc82c6165d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- 4. Inserir uma sessão de lazer concluída
INSERT INTO public.sessoes_lazer (user_id, duracao_minutos, status, data_fim) VALUES
('b0000a73-1415-4e00-8b17-07bc82c6165d', 25, 'concluido', NOW() - INTERVAL '1 day');


-- MÓDULO DE SONO

-- 1. Inserir registros de sono para o usuário de teste
INSERT INTO public.sleep_records (user_id, date, bedtime, wake_time, sleep_quality, notes) VALUES
('b0000a73-1415-4e00-8b17-07bc82c6165d', CURRENT_DATE - 3, '22:30', '06:30', 4, 'Dormi bem, sem interrupções.'),
('b0000a73-1415-4e00-8b17-07bc82c6165d', CURRENT_DATE - 2, '23:00', '06:45', 3, 'Acordei uma vez durante a noite.'),
('b0000a73-1415-4e00-8b17-07bc82c6165d', CURRENT_DATE - 1, '22:45', '06:30', 5, 'Sono profundo e reparador.');

-- 2. Inserir configuração de lembretes para o usuário de teste
INSERT INTO public.sleep_reminders (user_id, bedtime_reminder_enabled, bedtime_reminder_time, wake_reminder_enabled, wake_reminder_time, weekdays, message, active) VALUES
('b0000a73-1415-4e00-8b17-07bc82c6165d', true, '22:00', false, '06:30', '{1,2,3,4,5}', 'Hora de relaxar e se preparar para dormir!', true);
