-- ==============================================
-- DEBUG ROSTER AND CERTIFICATE_REQUESTS RELATIONSHIP
-- ==============================================

-- Check if certificate_requests table has roster relationships
SELECT 
  'CERTIFICATE_REQUESTS_WITH_ROSTERS' as test_name,
  cr.id as request_id,
  cr.roster_id,
  cr.recipient_name,
  cr.course_name,
  cr.status as request_status,
  r.name as roster_name,
  r.location_id,
  l.name as location_name
FROM certificate_requests cr
LEFT JOIN rosters r ON cr.roster_id = r.id  
LEFT JOIN locations l ON r.location_id = l.id
WHERE l.name LIKE '%Barrie%'
  AND cr.roster_id IS NOT NULL
ORDER BY cr.created_at DESC
LIMIT 10;

-- Check rosters vs certificate_requests count comparison
SELECT 
  'ROSTERS_VS_REQUESTS_COUNT' as test_name,
  r.name as roster_name,
  r.certificate_count as roster_count_field,
  COUNT(cr.id) as actual_certificate_requests,
  COUNT(c.id) as actual_certificates
FROM rosters r
LEFT JOIN certificate_requests cr ON r.id = cr.roster_id
LEFT JOIN certificates c ON r.id = c.roster_id
WHERE r.location_id = 'd4bcc036-101f-4339-b5e8-ea4e1347e83a'
  AND r.status = 'ACTIVE'
GROUP BY r.id, r.name, r.certificate_count
ORDER BY r.created_at DESC
LIMIT 5;