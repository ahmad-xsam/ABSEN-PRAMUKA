import React from 'react';
import { Compass, Plus, LogOut, CheckCircle2, Cloud } from 'lucide-react';

interface HeaderProps {
  onOpenModal: () => void;
  onLogout: () => void;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenModal, onLogout, isOnline }) => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-logo">
          <Compass size={30} />
        </div>
        <div className="brand-text">
          <h1>PRAMUKA SORDU</h1>
          <p>Rekap Input Latihan Hari, Tanggal, & Dokumentasi (Full-Stack TypeScript)</p>
          <div className="sync-badge">
            {isOnline ? (
              <>
                <CheckCircle2 size={12} color="#2E7D32" />
                <span>MongoDB Atlas Live Sync Active (100% Direct Cloud)</span>
              </>
            ) : (
              <>
                <Cloud size={12} color="#E65100" />
                <span>MongoDB Cloud Standby (Penyimpanan Lokal Aktif)</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="header-actions">
        <button className="btn btn-primary" onClick={onOpenModal}>
          <Plus size={18} /> Simpan Data Latihan
        </button>
        <button className="btn btn-outline" onClick={onLogout} title="Keluar">
          <LogOut size={18} /> Keluar
        </button>
      </div>
    </header>
  );
};
