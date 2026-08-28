import React from 'react';
import { ILatihanData } from '@/models/Latihan';
import { Edit2, Trash2, Maximize2, Inbox } from 'lucide-react';

interface RecapTableProps {
  data: ILatihanData[];
  onEdit: (item: ILatihanData) => void;
  onDelete: (id: string) => void;
  onViewImage: (src: string) => void;
  formatTanggalIndo: (dateStr: string) => string;
}

export const RecapTable: React.FC<RecapTableProps> = ({
  data,
  onEdit,
  onDelete,
  onViewImage,
  formatTanggalIndo,
}) => {
  return (
    <div className="table-card">
      <div className="table-header">
        <h2>
          <span>Rekap Input Latihan Pramuka Sordu</span>
          <span className="badge">{data.length} Data Pertemuan</span>
        </h2>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '50px', textAlign: 'center' }}>No</th>
              <th style={{ width: '180px' }}>Hari / Tanggal</th>
              <th style={{ width: '140px' }}>Tahun Pelajaran</th>
              <th>Uraian Kegiatan Latihan</th>
              <th style={{ width: '280px' }}>Dokumentasi Kegiatan</th>
              <th style={{ width: '110px', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <Inbox size={48} />
                    <h3>Belum Ada Data Rekap Latihan</h3>
                    <p>Silakan klik tombol "Simpan Data Latihan" untuk menambah data baru.</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr key={item.id || item._id || idx}>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                  <td className="tgl-badge">{formatTanggalIndo(item.tanggal)}</td>
                  <td>{item.tahunPelajaran}</td>
                  <td className="uraian-text">{item.uraian}</td>
                  <td>
                    <div className="doc-cell-grid">
                      <div className="doc-thumb-container" onClick={() => onViewImage(item.foto1)}>
                        <img src={item.foto1} alt="Dokumentasi 1" />
                        <div className="doc-thumb-overlay">
                          <Maximize2 size={16} />
                        </div>
                      </div>
                      <div className="doc-thumb-container" onClick={() => onViewImage(item.foto2)}>
                        <img src={item.foto2} alt="Dokumentasi 2" />
                        <div className="doc-thumb-overlay">
                          <Maximize2 size={16} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button
                        className="btn btn-outline btn-icon"
                        title="Edit Data"
                        onClick={() => onEdit(item)}
                      >
                        <Edit2 size={15} color="#5D4037" />
                      </button>
                      <button
                        className="btn btn-danger btn-icon"
                        title="Hapus Data"
                        onClick={() => item.id && onDelete(item.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
