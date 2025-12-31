-- Promote user to ADMIN role
-- Replace 'admin@laporan.com' with your actual admin email

UPDATE users SET role = 'ADMIN' WHERE email = 'admin@laporan.com';

-- Verify the change
SELECT id, email, name, role FROM users WHERE email = 'admin@laporan.com';
