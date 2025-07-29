-- Remover a constraint existente
ALTER TABLE athlete_professional_relationships DROP CONSTRAINT IF EXISTS athlete_professional_relationships_specialty_check;

-- Criar uma constraint que aceite todos os valores necessários, incluindo os existentes
ALTER TABLE athlete_professional_relationships 
ADD CONSTRAINT athlete_professional_relationships_specialty_check 
CHECK (specialty IN (
  'nutricao', 
  'medicina', 
  'fisioterapia', 
  'psicologia', 
  'treinamento',
  'medical',
  'nutrition',
  'physiotherapy',
  'psychology',
  'training',
  'Treinador',
  'Nutricionista',
  'Médico',
  'Fisioterapeuta',
  'Psicólogo'
));