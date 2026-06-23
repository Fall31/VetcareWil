// Helper to start the server in mock mode (no Supabase credentials needed)
process.env.USE_MOCK = 'true'
// Load dotenv if present to preserve behavior
try { require('dotenv').config() } catch (e) {}
require('./server')
