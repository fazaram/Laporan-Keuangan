-- Add role column to users table
ALTER TABLE users ADD COLUMN role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER';

-- Optional: Set a specific user as admin (replace 'admin@example.com' with actual admin email)
-- UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
