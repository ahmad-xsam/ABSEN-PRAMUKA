import React from 'react';
import { Calendar, Image as ImageIcon, Award } from 'lucide-react';

interface StatsBannerProps {
  totalPertemuan: number;
  totalFoto: number;
  bulanAktif: string;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({ totalPertemuan, totalFoto, bulanAktif }) => {
  return (
    <div className="stats-row">
      <div className="stat-card">
        <div className="stat-icon bg-amber">
          <Calendar size={24} />
        </div>
        <div>
          <span className="stat-value">{totalPertemuan} Pertemuan</span>
          <span className="stat-label">Total Input Rekap Latihan</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon bg-emerald">
          <ImageIcon size={24} />
        </div>
        <div>
          <span className="stat-value">{totalFoto} Foto Dokumentasi</span>
          <span className="stat-label">Terarsip di MongoDB Cloud</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon bg-brown">
          <Award size={24} />
        </div>
        <div>
          <span className="stat-value">{bulanAktif}</span>
          <span className="stat-label">Filter Periode Bulan Dilihat</span>
        </div>
      </div>
    </div>
  );
};
