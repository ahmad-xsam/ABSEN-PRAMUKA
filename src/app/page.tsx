'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ILatihanData } from '@/models/Latihan';
import { LoginLanding } from '@/components/LoginLanding';
import { Header } from '@/components/Header';
import { StatsBanner } from '@/components/StatsBanner';
import { FilterBar } from '@/components/FilterBar';
import { RecapTable } from '@/components/RecapTable';
import { FormModal } from '@/components/FormModal';
import { ImageViewerModal } from '@/components/ImageViewerModal';
import { PrintReport } from '@/components/PrintReport';

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatTanggalIndo(dateStr: string): string {
  if (!dateStr) return '';
  const dateObj = new Date(dateStr + 'T00:00:00');
  if (isNaN(dateObj.getTime())) return dateStr;

  const dayName = DAYS_ID[dateObj.getDay()];
  const dateNum = String(dateObj.getDate()).padStart(2, '0');
  const monthName = MONTHS_ID[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  return `${dayName}, ${dateNum} ${monthName} ${year}`;
}

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [latihanList, setLatihanList] = useState<ILatihanData[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [selectedBulan, setSelectedBulan] = useState<string>('ALL');
  const [selectedTahun, setSelectedTahun] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<ILatihanData | null>(null);
  const [imageViewerSrc, setImageViewerSrc] = useState<string | null>(null);

  // Auth initialization
  useEffect(() => {
    const savedAuth = localStorage.getItem('pramuka_auth_pass');
    if (savedAuth) {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch Data from TypeScript Next.js API
  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/latihan?_t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const items: ILatihanData[] = json.data.map((i: any) => ({
            ...i,
            id: i._id || i.id
          }));
          setLatihanList(items);
          setIsOnline(true);
          return;
        }
      }
      setIsOnline(false);
    } catch (err) {
      console.warn("API fetch error:", err);
      setIsOnline(false);
    }
  }, []);

  // Real-Time Multi-Device & Tab Sync (1 Second Polling + BroadcastChannel + Window Focus)
  useEffect(() => {
    if (!isAuthenticated) return;

    loadData();

    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('pramuka_sordu_sync') : null;
    if (channel) {
      channel.onmessage = () => loadData();
    }

    const interval = setInterval(loadData, 1000);

    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      if (channel) channel.close();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [isAuthenticated, loadData]);

  // Extract unique available school years
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    latihanList.forEach((item) => {
      if (item.tahunPelajaran) yearsSet.add(item.tahunPelajaran);
    });
    if (yearsSet.size === 0) yearsSet.add('2025/2026');
    return Array.from(yearsSet).sort();
  }, [latihanList]);

  // Filtered List based on Bulan, Tahun, Search
  const filteredList = useMemo(() => {
    return latihanList.filter((item) => {
      if (selectedBulan !== 'ALL') {
        const dateObj = new Date(item.tanggal + 'T00:00:00');
        if (!isNaN(dateObj.getTime())) {
          if (dateObj.getMonth() !== parseInt(selectedBulan, 10)) {
            return false;
          }
        }
      }

      if (selectedTahun !== 'ALL') {
        if (item.tahunPelajaran !== selectedTahun) return false;
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const textToSearch = `${item.uraian} ${item.tahunPelajaran} ${formatTanggalIndo(item.tanggal)}`.toLowerCase();
        if (!textToSearch.includes(q)) return false;
      }

      return true;
    });
  }, [latihanList, selectedBulan, selectedTahun, searchQuery]);

  // Calculate Statistics
  const totalPertemuan = filteredList.length;
  const totalFoto = useMemo(() => {
    return filteredList.reduce((acc, item) => {
      let count = 0;
      if (item.foto1) count++;
      if (item.foto2) count++;
      return acc + count;
    }, 0);
  }, [filteredList]);

  const bulanAktifText = useMemo(() => {
    if (selectedBulan === 'ALL') return 'Semua Bulan';
    return MONTHS_ID[parseInt(selectedBulan, 10)] || 'Semua Bulan';
  }, [selectedBulan]);

  // Save / Update Handler
  const handleSave = async (itemData: ILatihanData) => {
    const isValidMongoId = itemData.id && /^[0-9a-fA-F]{24}$/.test(String(itemData.id));
    const url = isValidMongoId ? `/api/latihan?id=${itemData.id}` : '/api/latihan';
    const method = isValidMongoId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('pramuka_sordu_sync') : null;
    if (channel) {
      channel.postMessage('update');
      channel.close();
    }

    await loadData();
  };

  // Delete Handler
  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data rekap latihan ini dari MongoDB Cloud?')) return;

    try {
      const res = await fetch(`/api/latihan?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus data.');

      const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('pramuka_sordu_sync') : null;
      if (channel) {
        channel.postMessage('update');
        channel.close();
      }

      await loadData();
    } catch (err) {
      alert('Error saat menghapus: ' + (err as Error).message);
    }
  };

  // Export PDF Handler
  const handleDownloadPDF = () => {
    if (typeof window === 'undefined') return;
    const element = document.getElementById('printReportContainer');
    if (!element) {
      alert('Elemen laporan tidak ditemukan.');
      return;
    }

    const html2pdf = (window as any).html2pdf;
    if (!html2pdf) {
      alert('Modul html2pdf sedang dimuat, silakan coba 2 detik lagi.');
      return;
    }

    element.style.display = 'block';

    const options = {
      margin: [12, 15, 12, 15],
      filename: `REKAP_LATIHAN_PRAMUKA_SORDU_${selectedTahun === 'ALL' ? '2025-2026' : selectedTahun.replace('/', '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    html2pdf().set(options).from(element).save().then(() => {
      element.style.display = 'none';
    }).catch(() => {
      element.style.display = 'none';
    });
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  if (!isAuthenticated) {
    return <LoginLanding onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="app-container">
      <Header
        onOpenModal={() => {
          setEditItem(null);
          setModalOpen(true);
        }}
        onLogout={() => {
          localStorage.removeItem('pramuka_auth_pass');
          setIsAuthenticated(false);
        }}
        isOnline={isOnline}
      />

      <StatsBanner
        totalPertemuan={totalPertemuan}
        totalFoto={totalFoto}
        bulanAktif={bulanAktifText}
      />

      <FilterBar
        selectedBulan={selectedBulan}
        onChangeBulan={setSelectedBulan}
        selectedTahun={selectedTahun}
        onChangeTahun={setSelectedTahun}
        searchQuery={searchQuery}
        onChangeSearch={setSearchQuery}
        availableYears={availableYears}
        onDownloadPDF={handleDownloadPDF}
        onPrint={handlePrint}
      />

      <RecapTable
        data={filteredList}
        onEdit={(item) => {
          setEditItem(item);
          setModalOpen(true);
        }}
        onDelete={handleDelete}
        onViewImage={setImageViewerSrc}
        formatTanggalIndo={formatTanggalIndo}
      />

      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editItem={editItem}
      />

      <ImageViewerModal
        imageSrc={imageViewerSrc}
        onClose={() => setImageViewerSrc(null)}
      />

      <PrintReport
        data={filteredList}
        selectedTahun={selectedTahun}
        formatTanggalIndo={formatTanggalIndo}
      />
    </div>
  );
}
