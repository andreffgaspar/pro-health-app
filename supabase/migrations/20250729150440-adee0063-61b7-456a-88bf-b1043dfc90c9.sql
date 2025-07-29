-- Verificar constraints existentes e corrigir o problema
-- Primeiro, vamos remover a constraint que está causando problema
ALTER TABLE athlete_professional_relationships DROP CONSTRAINT IF EXISTS athlete_professional_relationships_specialty_check;

-- Criar uma constraint mais flexível que aceite as especialidades necessárias
ALTER TABLE athlete_professional_relationships 
ADD CONSTRAINT athlete_professional_relationships_specialty_check 
CHECK (specialty IN (
  'nutricao', 
  'medicina', 
  'fisioterapia', 
  'psicologia', 
  'treinamento',
  'Treinador',
  'Nutricionista',
  'Médico',
  'Fisioterapeuta',
  'Psicólogo'
));