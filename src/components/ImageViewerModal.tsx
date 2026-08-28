import React from 'react';
import { X } from 'lucide-react';

interface ImageViewerModalProps {
  imageSrc: string | null;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ imageSrc, onClose }) => {
  if (!imageSrc) return null;

  return (
    <div className="modal-backdrop active" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ background: 'transparent', boxShadow: 'none', maxWidth: '90vw', width: 'auto', textAlign: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="btn-close"
          onClick={onClose}
          style={{ position: 'fixed', top: '24px', right: '24px', color: '#FFFFFF', fontSize: '32px' }}
        >
          <X size={32} />
        </button>
        <img
          src={imageSrc}
          alt="Dokumentasi Full Size"
          style={{ maxHeight: '85vh', maxWidth: '100%', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
        />
      </div>
    </div>
  );
};
