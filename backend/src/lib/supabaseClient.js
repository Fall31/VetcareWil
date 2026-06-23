const { createClient } = require('@supabase/supabase-js')
// Carga variables de entorno desde backend/.env (si existe)
require('dotenv').config()

// Lee las variables necesarias desde el entorno
const supabaseUrl = process.env.SUPABASE_URL || ''
// Para operaciones protegidas en el backend usa SUPABASE_SERVICE_KEY (service_role)
// Si no la tienes, puedes usar SUPABASE_ANON_KEY pero no es recomendable para acciones privilegiadas.
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
	console.warn('\n[warning] SUPABASE_URL o SUPABASE_SERVICE_KEY/SUPABASE_ANON_KEY no están definidas.\n' +
		'Rellena backend/.env con tus credenciales de Supabase (no subirlas a git).\n')
}

const supabase = createClient(supabaseUrl, supabaseKey)

module.exports = { supabase }
