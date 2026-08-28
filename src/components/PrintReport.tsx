import React from 'react';
import { ILatihanData } from '@/models/Latihan';

interface PrintReportProps {
  data: ILatihanData[];
  selectedTahun: string;
  formatTanggalIndo: (dateStr: string) => string;
}

export const PrintReport: React.FC<PrintReportProps> = ({
  data,
  selectedTahun,
  formatTanggalIndo,
}) => {
  // Chunk data into pages (2 items per page)
  const itemsPerPage = 2;
  const pageChunks: ILatihanData[][] = [];
  for (let i = 0; i < data.length; i += itemsPerPage) {
    pageChunks.push(data.slice(i, i + itemsPerPage));
  }

  const displayTahun = selectedTahun === 'ALL' ? '2025/2026' : selectedTahun;

  return (
    <div className="print-area" id="printReportContainer">
      {pageChunks.length === 0 ? (
        <div className="print-page">
          <div className="print-header">
            <h1 className="print-title">
              REKAP INPUT LATIHAN PRAMUKA SORDU TAHUN PELAJARAN {displayTahun}
            </h1>
          </div>
          <table className="print-table">
            <thead>
              <tr>
                <th className="col-no">NO</th>
                <th className="col-tanggal">HARI / TANGGAL</th>
                <th className="col-uraian">URAIAN KEGIATAN LATIHAN</th>
                <th style={{ width: '52%' }}>DOKUMENTASI KEGIATAN</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                  Tidak ada data untuk dicetak.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        pageChunks.map((chunk, pageIdx) => (
          <div className="print-page" key={pageIdx}>
            <div className="print-header">
              <h1 className="print-title">
                REKAP INPUT LATIHAN PRAMUKA SORDU TAHUN PELAJARAN {displayTahun}
              </h1>
            </div>

            <table className={`print-table ${pageIdx === 0 ? 'table-page-first' : 'table-page-subsequent'}`}>
              <thead>
                <tr>
                  <th className="col-no">NO</th>
                  <th className="col-tanggal">HARI / TANGGAL</th>
                  <th className="col-uraian">URAIAN KEGIATAN LATIHAN</th>
                  <th style={{ width: '52%' }}>DOKUMENTASI KEGIATAN</th>
                </tr>
              </thead>
              <tbody>
                {chunk.map((item, itemIdx) => {
                  const globalNo = pageIdx * itemsPerPage + itemIdx + 1;
                  return (
                    <tr key={item.id || item._id || itemIdx}>
                      <td className="col-no">{globalNo}</td>
                      <td className="col-tanggal">{formatTanggalIndo(item.tanggal)}</td>
                      <td className="col-uraian">{item.uraian}</td>
                      <td className="col-dokumentasi">
                        <div className="print-doc-grid">
                          <img src={item.foto1} alt={`Dokumentasi ${globalNo}-1`} />
                          <img src={item.foto2} alt={`Dokumentasi ${globalNo}-2`} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
};
