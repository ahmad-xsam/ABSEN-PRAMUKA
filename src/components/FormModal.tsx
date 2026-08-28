import React, { useState, useEffect } from 'react';
import { ILatihanData } from '@/models/Latihan';
import { X, Upload, Trash2, Save, Loader2, Compass } from 'lucide-react';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: ILatihanData) => Promise<void>;
  editItem: ILatihanData | null;
}

const DEFAULT_SCOUT_PHOTO =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%235D4037"/><circle cx="200" cy="120" r="45" fill="%23FF8F00"/><text x="50%" y="220" dominant-baseline="middle" text-anchor="middle" fill="%23FFFFFF" font-family="sans-serif" font-size="20" font-weight="bold">PRAMUKA SORDU</text><text x="50%" y="250" dominant-baseline="middle" text-anchor="middle" fill="%23E0E0E0" font-family="sans-serif" font-size="14">Dokumentasi Latihan</text></svg>';

function compressImage(file: File, maxWidth = 500, quality = 0.65): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          reject(new Error('Canvas context error'));
        }
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem,
}) => {
  const [tanggal, setTanggal] = useState('');
  const [tahunPelajaran, setTahunPelajaran] = useState('');
  const [uraian, setUraian] = useState('');
  const [foto1, setFoto1] = useState('');
  const [foto2, setFoto2] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editItem) {
      setTanggal(editItem.tanggal || '');
      setTahunPelajaran(editItem.tahunPelajaran || '');
      setUraian(editItem.uraian || '');
      setFoto1(editItem.foto1 || '');
      setFoto2(editItem.foto2 || '');
    } else {
      setTanggal(new Date().toISOString().split('T')[0]);
      setTahunPelajaran('2025/2026');
      setUraian('');
      setFoto1('');
      setFoto2('');
    }
  }, [editItem, isOpen]);

  if (!isOpen) return null;

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>, num: 1 | 2) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await compressImage(e.target.files[0]);
        if (num === 1) setFoto1(base64);
        else setFoto2(base64);
      } catch (err) {
        alert('Gagal memproses gambar foto.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggal) {
      alert('Tanggal Latihan belum diisi.');
      return;
    }
    if (!tahunPelajaran.trim()) {
      alert('Tahun Pelajaran belum diisi.');
      return;
    }
    if (!uraian.trim()) {
      alert('Uraian Kegiatan Latihan belum diisi.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        id: editItem?.id || editItem?._id,
        tanggal,
        tahunPelajaran: tahunPelajaran.trim(),
        uraian: uraian.trim(),
        foto1: foto1 || DEFAULT_SCOUT_PHOTO,
        foto2: foto2 || DEFAULT_SCOUT_PHOTO,
      });
      onClose();
    } catch (err) {
      alert('Error saat menyimpan: ' + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop active">
      <div className="modal-dialog modal-lg">
        <div className="modal-header">
          <h3>
            <Compass size={20} color="#5D4037" />
            {editItem ? 'Edit Data Rekap Latihan' : 'Form Input Rekap Latihan Pramuka'}
          </h3>
          <button className="btn-close" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>
                  Hari / Tanggal Latihan <span className="required">*</span>
                </label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Tahun Pelajaran <span className="required">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 2025/2026"
                  value={tahunPelajaran}
                  onChange={(e) => setTahunPelajaran(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                Uraian Kegiatan Latihan <span className="required">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Tuliskan materi atau uraian ringkas kegiatan latihan pramuka..."
                value={uraian}
                onChange={(e) => setUraian(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Upload Dokumentasi Foto Kegiatan (2 Foto)</label>
              <span className="field-hint">
                Disarankan mengunggah 2 foto terbaik kegiatan latihan pramuka.
              </span>

              <div className="photo-upload-grid">
                {/* Photo 1 */}
                <div className="photo-uploader">
                  {!foto1 ? (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        className="file-input"
                        onChange={(e) => handleFotoChange(e, 1)}
                      />
                      <div className="upload-placeholder">
                        <Upload size={28} />
                        <span>Pilih Foto 1</span>
                        <small>Format JPG/PNG</small>
                      </div>
                    </>
                  ) : (
                    <div className="upload-preview">
                      <img src={foto1} alt="Foto 1" />
                      <button
                        type="button"
                        className="btn-remove-photo"
                        onClick={() => setFoto1('')}
                        title="Hapus Foto 1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Photo 2 */}
                <div className="photo-uploader">
                  {!foto2 ? (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        className="file-input"
                        onChange={(e) => handleFotoChange(e, 2)}
                      />
                      <div className="upload-placeholder">
                        <Upload size={28} />
                        <span>Pilih Foto 2</span>
                        <small>Format JPG/PNG</small>
                      </div>
                    </>
                  ) : (
                    <div className="upload-preview">
                      <img src={foto2} alt="Foto 2" />
                      <button
                        type="button"
                        className="btn-remove-photo"
                        onClick={() => setFoto2('')}
                        title="Hapus Foto 2"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSaving}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Save size={16} /> Simpan Data Latihan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
