-- Script untuk membuat database PostgreSQL
-- Jalankan script ini di PostgreSQL command line atau pgAdmin

-- Buat database laporanKeuangan
CREATE DATABASE "laporanKeuangan"
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Atau versi sederhana:
-- CREATE DATABASE "laporanKeuangan";
