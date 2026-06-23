import { useState } from 'react';

export default function SupabaseDebug() {
  const [show, setShow] = useState(false);

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
      <button
        onClick={() => setShow(!show)}
        style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          border: 'none',
          backgroundColor: '#4CAF50',
          color: 'white',
          fontSize: 20,
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}
      >
        
      </button>
      {show && (
        <div style={{
          position: 'absolute',
          bottom: 60,
          right: 0,
          width: 300,
          backgroundColor: 'white',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          padding: 16
        }}>
          <h3 style={{ margin: 0, marginBottom: 12 }}> Supabase Debug</h3>
          <div style={{ fontSize: 14 }}>
            <div>Estado:  Conectado</div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              URL: {import.meta.env.VITE_SUPABASE_URL ? '' : ''}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '' : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
