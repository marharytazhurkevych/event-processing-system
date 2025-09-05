-- Initialize the event processing database
CREATE DATABASE IF NOT EXISTS event_processing;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The Prisma migrations will handle the actual table creation
