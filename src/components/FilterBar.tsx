import React from 'react';
import { Download, Printer, Search } from 'lucide-react';

interface FilterBarProps {
  selectedBulan: string;
  onChangeBulan: (val: string) => void;
  selectedTahun: string;
  onChangeTahun: (val: string) => void;
  searchQuery: string;
  onChangeSearch: (val: string) => void;
  availableYears: string[];
  onDownloadPDF: () => void;
  onPrint: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedBulan,
  onChangeBulan,
  selectedTahun,
  onChangeTahun,
  searchQuery,
  onChangeSearch,
  availableYears,
  onDownloadPDF,
  onPrint,
}) => {
  return (
    <div className="filter-card">
      <div className="filter-group">
        <div className="input-field">
          <label>Filter Bulan</label>
          <select value={selectedBulan} onChange={(e) => onChangeBulan(e.target.value)}>
            <option value="ALL">-- Semua Bulan --</option>
            <option value="0">Januari</option>
            <option value="1">Februari</option>
            <option value="2">Maret</option>
            <option value="3">April</option>
            <option value="4">Mei</option>
            <option value="5">Juni</option>
            <option value="6">Juli</option>
            <option value="7">Agustus</option>
            <option value="8">September</option>
            <option value="9">Oktober</option>
            <option value="10">November</option>
            <option value="11">Desember</option>
          </select>
        </div>

        <div className="input-field">
          <label>Tahun Pelajaran</label>
          <select value={selectedTahun} onChange={(e) => onChangeTahun(e.target.value)}>
            <option value="ALL">-- Semua Tahun Pelajaran --</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        <div className="input-field" style={{ flex: 1 }}>
          <label>Cari Uraian Kegiatan</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Cari kata kunci kegiatan..."
              value={searchQuery}
              onChange={(e) => onChangeSearch(e.target.value)}
              style={{ paddingLeft: '36px', width: '100%' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#A8A29E' }} />
          </div>
        </div>
      </div>

      <div className="export-actions">
        <button className="btn btn-emerald" onClick={onDownloadPDF}>
          <Download size={16} /> Unduh PDF A4
        </button>
        <button className="btn btn-secondary" onClick={onPrint}>
          <Printer size={16} /> Cetak Laporan
        </button>
      </div>
    </div>
  );
};
