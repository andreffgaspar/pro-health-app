-- Remover a constraint existente
ALTER TABLE athlete_professional_relationships DROP CONSTRAINT IF EXISTS athlete_professional_relationships_specialty_check;

-- Criar uma constraint que aceite todos os valores corretos do frontend
ALTER TABLE athlete_professional_relationships 
ADD CONSTRAINT athlete_professional_relationships_specialty_check 
CHECK (specialty IN (
  'personal_trainer',
  'physiotherapist', 
  'nutritionist',
  'psychologist',
  'doctor',
  'coach',
  'medical',
  'nutrition',
  'fisioterapia',
  'psicologia',
  'treinamento',
  'nutricao',
  'medicina',
  'Treinador',
  'Nutricionista',
  'Médico',
  'Fisioterapeuta',
  'Psicólogo'
));