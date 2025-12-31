-- Create a viewer user (read-only access)
-- Replace the values with your desired credentials

-- Insert viewer user
INSERT INTO users (id, email, password, name, role, createdAt, updatedAt)
VALUES (
    'viewer_001',
    'viewer@laporan.com',
    '$2a$10$xYz...', -- Replace with hashed password
    'View Only User',
    'VIEWER',
    NOW(),
    NOW()
);

-- Verify the user was created
SELECT id, email, name, role FROM users WHERE role = 'VIEWER';

-- Note: To generate hashed password, use bcrypt with cost 10
-- Or use the create-viewer.ts script instead:
-- npx tsx prisma/create-viewer.ts viewer@laporan.com viewer123 "View Only User"
