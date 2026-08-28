/* ==========================================================================
   PRAMUKA SORDU APPLICATION LOGIC (app.js)
   ========================================================================== */

// Constants & Utilities
const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// IndexedDB Helper
const DB_NAME = 'PramukaSorduDB';
const DB_VERSION = 1;
const STORE_NAME = 'latihan';

class DatabaseService {
    static openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    static async getAll() {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    static async save(item) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.put(item);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    static async delete(id) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.delete(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    static async clearAll() {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.clear();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

// Application State
let latihanList = [];
let tempFoto1 = '';
let tempFoto2 = '';

// DOM Elements
const filterBulan = document.getElementById('filterBulan');
const filterTahunPelajaran = document.getElementById('filterTahunPelajaran');
const searchQuery = document.getElementById('searchQuery');

const statTotalPertemuan = document.getElementById('statTotalPertemuan');
const statTotalFoto = document.getElementById('statTotalFoto');
const statBulanAktif = document.getElementById('statBulanAktif');

const tabelRecapBody = document.getElementById('tabelRecapBody');
const emptyState = document.getElementById('emptyState');
const badgeJumlahData = document.getElementById('badgeJumlahData');

const modalForm = document.getElementById('modalForm');
const modalTitle = document.getElementById('modalTitle');
const formLatihan = document.getElementById('formLatihan');
const editId = document.getElementById('editId');
const inputTanggal = document.getElementById('inputTanggal');
const hintHariFormatted = document.getElementById('hintHariFormatted');
const inputTahunPelajaran = document.getElementById('inputTahunPelajaran');
const inputUraian = document.getElementById('inputUraian');

const foto1 = document.getElementById('foto1');
const foto2 = document.getElementById('foto2');
const placeholder1 = document.getElementById('placeholder1');
const placeholder2 = document.getElementById('placeholder2');
const previewContainer1 = document.getElementById('previewContainer1');
const previewContainer2 = document.getElementById('previewContainer2');
const imgPreview1 = document.getElementById('imgPreview1');
const imgPreview2 = document.getElementById('imgPreview2');
const btnRemoveFoto1 = document.getElementById('btnRemoveFoto1');
const btnRemoveFoto2 = document.getElementById('btnRemoveFoto2');

const modalImageViewer = document.getElementById('modalImageViewer');
const fullImageViewerSrc = document.getElementById('fullImageViewerSrc');
const btnCloseImageViewer = document.getElementById('btnCloseImageViewer');

// Helper: Format Indonesian Date String
function formatTanggalIndo(dateStr) {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr + 'T00:00:00');
    if (isNaN(dateObj)) return dateStr;

    const dayName = DAYS_ID[dateObj.getDay()];
    const dateNum = String(dateObj.getDate()).padStart(2, '0');
    const monthName = MONTHS_ID[dateObj.getMonth()];
    const year = dateObj.getFullYear();

    return `${dayName}, ${dateNum} ${monthName} ${year}`;
}

// Helper: Compress and Convert Image File to Base64
function compressImage(file, maxWidth = 800, quality = 0.82) {
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
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Helper: Generate Placeholder Canvas Image
function generateSamplePhoto(text, color1, color2) {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');
    
    // Background Gradient
    const grad = ctx.createLinearGradient(0, 0, 600, 450);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 450);

    // Decorative Elements
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(300, 225, 160, 0, Math.PI * 2);
    ctx.fill();

    // Text Label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DOKUMENTASI PRAMUKA SORDU', 300, 190);

    ctx.font = '20px Plus Jakarta Sans, sans-serif';
    ctx.fillText(text, 300, 240);

    return canvas.toDataURL('image/jpeg', 0.85);
}

// Initialize Seed Data if DB is Empty
async function initSeedData() {
    const data = await DatabaseService.getAll();
    if (data.length === 0) {
        const samplePhoto1 = generateSamplePhoto('Latihan Apel & Baris-Berbaris', '#5D4037', '#795548');
        const samplePhoto2 = generateSamplePhoto('Upacara Penggalang & Pembukaan', '#FF8F00', '#FF6F00');
        const samplePhoto3 = generateSamplePhoto('Pramuka Sordu di Ruang Kelas', '#2E7D32', '#1B5E20');
        const samplePhoto4 = generateSamplePhoto('Materi Tali Menali & Semaphore', '#475569', '#334155');

        const seedItems = [
            {
                id: 'seed-1',
                tanggal: '2026-08-01',
                tahunPelajaran: '2026-2027',
                uraian: 'Latihan rutin Pembukaan Bulan Agustus: Pelatihan Baris Berbaris (PBB), Pengenalan Dasa Darma Pramuka, serta Gladi Apel Pasukan Gudep Sordu.',
                foto1: samplePhoto1,
                foto2: samplePhoto2
            },
            {
                id: 'seed-2',
                tanggal: '2026-08-05',
                tahunPelajaran: '2026-2027',
                uraian: 'Materi Kelas: Pengetahuan Umum Pramuka (PUPK), Latihan Sandi Morse, serta Evaluasi Kelengkapan Seragam & Atribut Pramuka Penggalang.',
                foto1: samplePhoto3,
                foto2: samplePhoto4
            }
        ];

        for (const item of seedItems) {
            await DatabaseService.save(item);
        }
    }
}

// Render Dashboard Data & Tables
async function loadData() {
    latihanList = await DatabaseService.getAll();
    renderApp();
}

function renderApp() {
    const selectedBulan = filterBulan.value;
    const selectedTahun = filterTahunPelajaran.value.trim().toLowerCase();
    const query = searchQuery.value.trim().toLowerCase();

    // Filter Items
    const filteredList = latihanList.filter(item => {
        const itemDate = new Date(item.tanggal + 'T00:00:00');
        const itemMonth = String(itemDate.getMonth() + 1).padStart(2, '0');
        const matchMonth = itemMonth === selectedBulan;
        const matchTahun = !selectedTahun || (item.tahunPelajaran && item.tahunPelajaran.toLowerCase().includes(selectedTahun));
        const matchQuery = !query || item.uraian.toLowerCase().includes(query);

        return matchMonth && matchTahun && matchQuery;
    });

    // Sort by Date Ascending
    filteredList.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

    // Update Statistics
    statTotalPertemuan.textContent = filteredList.length;
    let fotoCount = 0;
    filteredList.forEach(i => {
        if (i.foto1) fotoCount++;
        if (i.foto2) fotoCount++;
    });
    statTotalFoto.textContent = fotoCount;
    statBulanAktif.textContent = `${MONTHS_ID[parseInt(selectedBulan, 10) - 1]} ${filterTahunPelajaran.value}`;
    badgeJumlahData.textContent = `${filteredList.length} Data Pertemuan`;

    // Render Web UI Table Body
    tabelRecapBody.innerHTML = '';
    
    if (filteredList.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        
        filteredList.forEach((item, index) => {
            const tr = document.createElement('tr');
            const formattedDate = formatTanggalIndo(item.tanggal);

            tr.innerHTML = `
                <td style="text-align: center; font-weight: 700;">${index + 1}.</td>
                <td><span class="tgl-badge">${formattedDate}</span></td>
                <td><div class="uraian-text">${escapeHtml(item.uraian)}</div></td>
                <td>
                    <div class="doc-cell-grid">
                        <div class="doc-thumb-container" onclick="openImageViewer('${item.foto1}')">
                            <img src="${item.foto1}" alt="Dokumentasi 1">
                            <div class="doc-thumb-overlay"><i class="fa-solid fa-expand"></i></div>
                        </div>
                        <div class="doc-thumb-container" onclick="openImageViewer('${item.foto2}')">
                            <img src="${item.foto2}" alt="Dokumentasi 2">
                            <div class="doc-thumb-overlay"><i class="fa-solid fa-expand"></i></div>
                        </div>
                    </div>
                </td>
                <td class="no-print-col" style="text-align: center;">
                    <div style="display: flex; gap: 6px; justify-content: center;">
                        <button class="btn btn-outline btn-sm btn-icon" onclick="editData('${item.id}')" title="Edit Data">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-danger btn-sm btn-icon" onclick="hapusData('${item.id}')" title="Hapus Data">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tabelRecapBody.appendChild(tr);
        });
    }

    // Render Print & PDF Container
    renderPrintTable(filteredList);
}

// Render Hidden Container specifically formatted for PDF / Print Output (Strict 2 Days = 4 Photos per Page)
function renderPrintTable(filteredList) {
    const printArea = document.getElementById('printArea');
    const monthIndex = parseInt(filterBulan.value, 10) - 1;
    const namaBulanCaps = MONTHS_ID[monthIndex].toUpperCase();
    const tahunPelajaranStr = filterTahunPelajaran.value.trim();

    printArea.innerHTML = '';

    if (filteredList.length === 0) {
        printArea.innerHTML = `
            <div class="print-page">
                <div class="print-header">
                    <h1 class="print-title">LAPORAN KEGIATAN EKSTRAKURIKULER</h1>
                    <h1 class="print-title">PRAMUKA BULAN ${namaBulanCaps}</h1>
                    <h1 class="print-title">TAHUN PELAJARAN ${tahunPelajaranStr}</h1>
                </div>
                <table class="print-table">
                    <thead>
                        <tr>
                            <th class="col-no">No</th>
                            <th class="col-tanggal">Hari, Tanggal</th>
                            <th class="col-uraian">Uraian Kegiatan</th>
                            <th class="col-dokumentasi">Dokumentasi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="4" style="text-align: center; padding: 30px;">
                                Tidak ada data rekap latihan pada Bulan ${MONTHS_ID[monthIndex]} Tahun Pelajaran ${tahunPelajaranStr}.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        return;
    }

    // Chunk list into pages of max 2 items per page (2 entries = 4 photos per page)
    const itemsPerPage = 2;
    for (let i = 0; i < filteredList.length; i += itemsPerPage) {
        const pageItems = filteredList.slice(i, i + itemsPerPage);
        const pageDiv = document.createElement('div');
        pageDiv.className = 'print-page';

        let rowsHtml = '';
        pageItems.forEach((item, pageIndex) => {
            const globalIndex = i + pageIndex + 1;
            const formattedDate = formatTanggalIndo(item.tanggal);
            rowsHtml += `
                <tr>
                    <td class="col-no">${globalIndex}.</td>
                    <td class="col-tanggal">${formattedDate}</td>
                    <td class="col-uraian">${escapeHtml(item.uraian)}</td>
                    <td class="col-dokumentasi">
                        <div class="print-doc-grid">
                            <img src="${item.foto1}" alt="Dokumentasi 1">
                            <img src="${item.foto2}" alt="Dokumentasi 2">
                        </div>
                    </td>
                </tr>
            `;
        });

        pageDiv.innerHTML = `
            <div class="print-header">
                <h1 class="print-title">LAPORAN KEGIATAN EKSTRAKURIKULER</h1>
                <h1 class="print-title">PRAMUKA BULAN ${namaBulanCaps}</h1>
                <h1 class="print-title">TAHUN PELAJARAN ${tahunPelajaranStr}</h1>
            </div>
            <table class="print-table">
                <thead>
                    <tr>
                        <th class="col-no">No</th>
                        <th class="col-tanggal">Hari, Tanggal</th>
                        <th class="col-uraian">Uraian Kegiatan</th>
                        <th class="col-dokumentasi">Dokumentasi</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        `;
        printArea.appendChild(pageDiv);
    }
}

// Form Handlers & Modals
function openModal(isEdit = false) {
    modalForm.classList.add('active');
    if (!isEdit) {
        modalTitle.innerHTML = '<i class="fa-solid fa-calendar-plus"></i> Tambah Data Latihan Baru';
        editId.value = '';
        formLatihan.reset();
        tempFoto1 = '';
        tempFoto2 = '';
        resetUploader(1);
        resetUploader(2);
        
        // Default today's date
        const today = new Date().toISOString().split('T')[0];
        inputTanggal.value = today;
        updateFormattedDateHint();
    }
}

function closeModal() {
    modalForm.classList.remove('active');
}

function updateFormattedDateHint() {
    if (inputTanggal.value) {
        hintHariFormatted.textContent = `Format Laporan: ${formatTanggalIndo(inputTanggal.value)}`;
    } else {
        hintHariFormatted.textContent = 'Otomatis: Pilih tanggal di atas';
    }
}

function resetUploader(slot) {
    if (slot === 1) {
        placeholder1.classList.remove('hidden');
        previewContainer1.classList.add('hidden');
        imgPreview1.src = '';
        foto1.value = '';
    } else {
        placeholder2.classList.remove('hidden');
        previewContainer2.classList.add('hidden');
        imgPreview2.src = '';
        foto2.value = '';
    }
}

function setPhotoPreview(slot, src) {
    if (slot === 1) {
        tempFoto1 = src;
        imgPreview1.src = src;
        placeholder1.classList.add('hidden');
        previewContainer1.classList.remove('hidden');
    } else {
        tempFoto2 = src;
        imgPreview2.src = src;
        placeholder2.classList.add('hidden');
        previewContainer2.classList.remove('hidden');
    }
}

// Global Image Viewer Modal
window.openImageViewer = function(src) {
    fullImageViewerSrc.src = src;
    modalImageViewer.classList.add('active');
};

function closeImageViewer() {
    modalImageViewer.classList.remove('active');
}

// Edit Item
window.editData = function(id) {
    const item = latihanList.find(i => i.id === id);
    if (!item) return;

    modalTitle.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Data Latihan';
    editId.value = item.id;
    inputTanggal.value = item.tanggal;
    updateFormattedDateHint();
    inputTahunPelajaran.value = item.tahunPelajaran || '2026-2027';
    inputUraian.value = item.uraian;

    if (item.foto1) setPhotoPreview(1, item.foto1);
    if (item.foto2) setPhotoPreview(2, item.foto2);

    modalForm.classList.add('active');
};

// Delete Item
window.hapusData = async function(id) {
    if (confirm('Apakah Anda yakin ingin menghapus data latihan ini?')) {
        await DatabaseService.delete(id);
        await loadData();
    }
};

// HTML Escaper
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// PDF Download Generator via html2pdf.js
function downloadPDF() {
    const printElement = document.getElementById('printArea');
    
    // Temporarily make print element block for html2pdf renderer
    printElement.style.display = 'block';

    const monthName = MONTHS_ID[parseInt(filterBulan.value, 10) - 1];
    const tahunStr = filterTahunPelajaran.value.replace(/[^a-zA-Z0-9-]/g, '_');
    const filename = `Laporan_Pramuka_Sordu_${monthName}_${tahunStr}.pdf`;

    const opt = {
        margin:       [10, 10, 10, 10], // top, left, bottom, right in mm
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(printElement).save().then(() => {
        printElement.style.display = 'none';
    });
}

// Event Listeners Initialization
document.addEventListener('DOMContentLoaded', async () => {
    await initSeedData();
    await loadData();

    // Filters
    filterBulan.addEventListener('change', renderApp);
    filterTahunPelajaran.addEventListener('input', renderApp);
    searchQuery.addEventListener('input', renderApp);

    // Date change event
    inputTanggal.addEventListener('change', updateFormattedDateHint);

    // Modal Control
    document.getElementById('btnTambahLatihan').addEventListener('click', () => openModal(false));
    document.getElementById('btnCloseModal').addEventListener('click', closeModal);
    document.getElementById('btnBatal').addEventListener('click', closeModal);
    btnCloseImageViewer.addEventListener('click', closeImageViewer);

    // Photo Input 1 Listener
    foto1.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64 = await compressImage(e.target.files[0]);
                setPhotoPreview(1, base64);
            } catch (err) {
                alert('Gagal memproses gambar foto 1.');
            }
        }
    });

    // Photo Input 2 Listener
    foto2.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64 = await compressImage(e.target.files[0]);
                setPhotoPreview(2, base64);
            } catch (err) {
                alert('Gagal memproses gambar foto 2.');
            }
        }
    });

    btnRemoveFoto1.addEventListener('click', (e) => {
        e.stopPropagation();
        tempFoto1 = '';
        resetUploader(1);
    });

    btnRemoveFoto2.addEventListener('click', (e) => {
        e.stopPropagation();
        tempFoto2 = '';
        resetUploader(2);
    });

    // Form Submission
    formLatihan.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!tempFoto1 || !tempFoto2) {
            alert('Wajib melampirkan 2 Foto Dokumentasi untuk setiap kegiatan latihan.');
            return;
        }

        const id = editId.value || 'lat-' + Date.now();
        const itemData = {
            id: id,
            tanggal: inputTanggal.value,
            tahunPelajaran: inputTahunPelajaran.value.trim(),
            uraian: inputUraian.value.trim(),
            foto1: tempFoto1,
            foto2: tempFoto2
        };

        await DatabaseService.save(itemData);
        closeModal();
        await loadData();
    });

    // PDF Download Button
    document.getElementById('btnUnduhPDF').addEventListener('click', downloadPDF);

    // Print Button
    document.getElementById('btnCetak').addEventListener('click', () => {
        window.print();
    });

    // Backup & Restore
    document.getElementById('btnBackup').addEventListener('click', async () => {
        const allData = await DatabaseService.getAll();
        const jsonStr = JSON.stringify(allData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Backup_Pramuka_Sordu_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    document.getElementById('btnRestore').addEventListener('click', () => {
        document.getElementById('fileRestoreInput').click();
    });

    document.getElementById('fileRestoreInput').addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const importedData = JSON.parse(evt.target.result);
                    if (Array.isArray(importedData)) {
                        await DatabaseService.clearAll();
                        for (const item of importedData) {
                            await DatabaseService.save(item);
                        }
                        await loadData();
                        alert('Data rekap latihan berhasil di-restore!');
                    }
                } catch (err) {
                    alert('Format file backup JSON tidak valid.');
                }
            };
            reader.readAsText(e.target.files[0]);
        }
    });
});
