-- Script para desabilitar temporariamente o trigger e testar
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Desabilitar o trigger temporariamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Agora teste o signup via frontend
-- Se funcionar, o problema é o trigger

-- 3. Para reabilitar depois (NÃO EXECUTE AINDA):
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION handle_new_user();