-- Update navigation visibility configuration to include Students in User Management group
UPDATE system_configurations 
SET value = jsonb_set(
  jsonb_set(
    value,
    '{SA,User Management,items,Students}',
    'true',
    true
  ),
  '{AD,User Management,items,Students}',
  'true',
  true
)
WHERE category = 'navigation' AND key = 'visibility';

-- Also enable User Management group for AD role since Students should be accessible to admins
UPDATE system_configurations 
SET value = jsonb_set(
  value,
  '{AD,User Management,enabled}',
  'true',
  true
)
WHERE category = 'navigation' AND key = 'visibility';