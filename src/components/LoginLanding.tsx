import React, { useState } from 'react';
import { Compass, KeyRound, ShieldAlert } from 'lucide-react';

interface LoginLandingProps {
  onLoginSuccess: (pass: string) => void;
}

export const LoginLanding: React.FC<LoginLandingProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123' || password === 'pramuka' || password.trim().length > 0) {
      localStorage.setItem('pramuka_auth_pass', password);
      onLoginSuccess(password);
    } else {
      setErrorMsg('Sandi Keamanan tidak boleh kosong.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justify-content: 'center',
      background: 'linear-gradient(135deg, #5D4037 0%, #3E2723 100%)',
      padding: '20px',
      fontFamily: 'Plus Jakarta Sans, sans-serif'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '440px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: 'linear-gradient(135deg, #FF8F00, #FF6F00)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justify-content: 'center',
          margin: '0 auto 20px',
          color: '#FFFFFF',
          boxShadow: '0 8px 16px rgba(255, 143, 0, 0.3)'
        }}>
          <Compass size={36} />
        </div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#5D4037',
          marginBottom: '6px'
        }}>PRAMUKA SORDU</h2>
        <p style={{
          fontSize: '14px',
          color: '#57534E',
          marginBottom: '28px'
        }}>Aplikasi Rekap Latihan Pembina Pramuka (TypeScript & MongoDB Cloud)</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#57534E', marginBottom: '6px' }}>
              SANDI AKSES PEMBINA
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="Masukkan Sandi Pembina..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  borderRadius: '10px',
                  border: '1px solid #E7E5E4',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <KeyRound size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8D6E63' }} />
            </div>
          </div>

          {errorMsg && (
            <div style={{ color: '#D32F2F', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={16} /> {errorMsg}
            </div>
          )}

          <button
            type="submit"
            style={{
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: '#5D4037',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(93, 64, 55, 0.3)'
            }}
          >
            Masuk ke Aplikasi
          </button>
        </form>
      </div>
    </div>
  );
};
