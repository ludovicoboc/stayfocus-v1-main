-- Script para popular os módulos de Finanças e Concursos com dados de teste (VERSÃO CORRIGIDA)

-- UUID do usuário de teste gerado
-- ID: b0000a73-1415-4e00-8b17-07bc82c6165d

-- MÓDULO DE FINANÇAS

-- 1. Inicializar as categorias padrão de finanças para o usuário de teste.
SELECT initialize_default_categories_for_user('b0000a73-1415-4e00-8b17-07bc82c6165d');

-- 2. Inserir um envelope virtual (com colunas corretas)
INSERT INTO public.virtual_envelopes (user_id, name, color, total_amount, used_amount) VALUES
('b0000a73-1415-4e00-8b17-07bc82c6165d', 'Viagem de Férias', '#8b5cf6', 2500.00, 350.00);

-- 3. Inserir um pagamento agendado (com coluna 'title' correta)
INSERT INTO public.scheduled_payments (user_id, title, amount, due_date, recurrence_type, recurrence_interval) VALUES
('b0000a73-1415-4e00-8b17-07bc82c6165d', 'Assinatura de Streaming', 39.90, CURRENT_DATE + 10, 'monthly', 1);

-- 4. Inserir uma meta financeira (esta tabela estava correta)
INSERT INTO public.financial_goals (user_id, name, target_amount, current_amount, target_date) VALUES
('b0000a73-1415-4e00-8b17-07bc82c6165d', 'Reserva de Emergência', 10000.00, 1200.00, '2026-12-31');


-- MÓDULO DE CONCURSOS

-- 1. Inserir um concurso (com colunas corretas e associado ao usuário)
INSERT INTO public.competitions (id, user_id, title, organizer, exam_date, status) VALUES
('c0000a73-1415-4e00-8b17-07bc82c6165d', 'b0000a73-1415-4e00-8b17-07bc82c6165d', 'Banco Central 2025', 'Cebraspe', '2025-12-15', 'estudando');

-- 2. Inserir matérias para o concurso
INSERT INTO public.competition_subjects (id, competition_id, name) VALUES
('d0000a73-1415-4e00-8b17-07bc82c6165d', 'c0000a73-1415-4e00-8b17-07bc82c6165d', 'Segurança da Informação');

-- 3. Inserir tópicos para a matéria
INSERT INTO public.competition_topics (subject_id, name) VALUES
('d0000a73-1415-4e00-8b17-07bc82c6165d', 'Criptografia'),
('d0000a73-1415-4e00-8b17-07bc82c6165d', 'Gestão de Riscos');

-- 4. Inserir questões para o concurso (com coluna 'question_text' correta e dificuldade em minúsculo)
INSERT INTO public.competition_questions (competition_id, subject_id, question_type, question_text, options, correct_answer, difficulty) VALUES
('c0000a73-1415-4e00-8b17-07bc82c6165d', 'd0000a73-1415-4e00-8b17-07bc82c6165d', 'multiple_choice', 'Qual dos seguintes algoritmos é um exemplo de criptografia assimétrica?', '{"A": "AES", "B": "DES", "C": "RSA", "D": "3DES"}', 'C', 'medio');

-- 5. Inserir um registro de atividade (com 'activity_type' correto)
INSERT INTO public.activity_history (user_id, activity_type, module, duration_minutes, score, category) VALUES
('b0000a73-1415-4e00-8b17-07bc82c6165d', 'study_session', 'concursos', 45, 85, 'Segurança da Informação');