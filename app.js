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

const DEFAULT_SCOUT_PHOTO = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%235D4037"/><circle cx="200" cy="120" r="45" fill="%23FF8F00"/><text x="50%" y="220" dominant-baseline="middle" text-anchor="middle" fill="%23FFFFFF" font-family="sans-serif" font-size="20" font-weight="bold">PRAMUKA SORDU</text><text x="50%" y="250" dominant-baseline="middle" text-anchor="middle" fill="%23E0E0E0" font-family="sans-serif" font-size="14">Dokumentasi Latihan</text></svg>';

class DatabaseService {
    static async getAllCloud() {
        try {
            const res = await fetch(`/api/latihan?_t=${Date.now()}`);
            if (res.ok) {
                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    const items = json.data.map(item => ({
                        ...item,
                        id: item._id || item.id
                    }));
                    return { isOnline: true, data: items };
                }
            }
        } catch (err) {
            console.warn("MongoDB Cloud API offline or not configured yet:", err);
        }
        return { isOnline: false, data: null };
    }

    static async getAll() {
        const cloudResult = await this.getAllCloud();
        if (cloudResult.isOnline && cloudResult.data) {
            // Keep local synced
            for (const item of cloudResult.data) {
                await this.saveLocal(item);
            }
            return cloudResult.data;
        }
        return await this.getAllLocal();
    }

    static async save(item) {
        let isCloudSaved = false;
        let savedItem = { ...item };

        try {
            const isValidMongoId = item.id && /^[0-9a-fA-F]{24}$/.test(String(item.id));
            const isEdit = Boolean(isValidMongoId);
            const url = isEdit ? `/api/latihan?id=${item.id}` : '/api/latihan';
            const method = isEdit ? 'PUT' : 'POST';

            const payload = { ...item };
            if (!isValidMongoId) {
                delete payload.id;
                delete payload._id;
            }

            if (!payload.foto1) payload.foto1 = DEFAULT_SCOUT_PHOTO;
            if (!payload.foto2) payload.foto2 = DEFAULT_SCOUT_PHOTO;

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                    savedItem = { ...json.data, id: json.data._id || json.data.id };
                    isCloudSaved = true;
                }
            }
        } catch (err) {
            console.warn("Could not save to MongoDB Cloud API, falling back to device memory:", err);
        }

        // Always ensure local storage is updated so user data is never lost
        if (!savedItem.id) {
            savedItem.id = 'loc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        }
        await this.saveLocal(savedItem);

        return { isCloud: isCloudSaved, data: savedItem };
    }

    static async delete(id) {
        try {
            await fetch(`/api/latihan?id=${id}`, { method: 'DELETE' });
        } catch (err) {
            console.error("Error deleting from MongoDB REST API:", err);
        }
    }

    static async bulkSave(items) {
        try {
            const res = await fetch('/api/latihan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(items)
            });
            if (res.ok) {
                await this.clearAllLocal();
                for (const item of items) {
                    await this.saveLocal(item);
                }
            }
        } catch (err) {
            console.warn("Error bulk saving to MongoDB API:", err);
        }
    }

    // Local IndexedDB Fallbacks
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

    static async getAllLocal() {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    static async saveLocal(item) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.put(item);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    static async deleteLocal(id) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.delete(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    static async clearAllLocal() {
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

// Disable Sample Data Generator (Clean Database Mode)
async function initSeedData() {
    // Clean mode: no dummy/sample data generated
}

// Render Dashboard Data & Tables
async function loadData() {
    const syncStatus = document.getElementById('syncStatus');
    let isCloudActive = false;

    try {
        const cloudRes = await DatabaseService.getAllCloud();
        if (cloudRes.isOnline && cloudRes.data) {
            latihanList = cloudRes.data;
            isCloudActive = true;
        } else {
            latihanList = await DatabaseService.getAllLocal();
        }
    } catch (e) {
        latihanList = await DatabaseService.getAllLocal();
    }

    if (syncStatus) {
        if (isCloudActive) {
            syncStatus.innerHTML = '<i class="fa-solid fa-circle" style="color: #2E7D32;"></i> MongoDB Atlas Cloud Active (Live Synchronized)';
            syncStatus.style.backgroundColor = '#E8F5E9';
            syncStatus.style.color = '#2E7D32';
            syncStatus.style.borderColor = '#A5D6A7';
        } else {
            syncStatus.innerHTML = '<i class="fa-solid fa-circle-exclamation" style="color: #E65100;"></i> MongoDB Atlas Standby (Set MONGODB_URI di Vercel)';
            syncStatus.style.backgroundColor = '#FFF3E0';
            syncStatus.style.color = '#E65100';
            syncStatus.style.borderColor = '#FFE0B2';
        }
    }

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
        const isFirstPage = (i === 0);
        pageDiv.className = `print-page ${isFirstPage ? 'page-first' : 'page-subsequent'}`;

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

        const headerHtml = isFirstPage ? `
            <div class="print-header">
                <h1 class="print-title">LAPORAN KEGIATAN EKSTRAKURIKULER</h1>
                <h1 class="print-title">PRAMUKA BULAN ${namaBulanCaps}</h1>
                <h1 class="print-title">TAHUN PELAJARAN ${tahunPelajaranStr}</h1>
            </div>
        ` : '';

        pageDiv.innerHTML = `
            ${headerHtml}
            <table class="print-table ${isFirstPage ? 'table-page-first' : 'table-page-subsequent'}">
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

// Authentication State & UI Helper Functions
const btnLoginNav = document.getElementById('btnLoginNav');
const userProfileArea = document.getElementById('userProfileArea');
const btnLogoutNav = document.getElementById('btnLogoutNav');
const modalLogin = document.getElementById('modalLogin');
const formLogin = document.getElementById('formLogin');
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const btnCloseModalLogin = document.getElementById('btnCloseModalLogin');
const btnBatalLogin = document.getElementById('btnBatalLogin');
const loginAlert = document.getElementById('loginAlert');
const loginAlertText = document.getElementById('loginAlertText');
const btnTogglePassword = document.getElementById('btnTogglePassword');
const iconTogglePassword = document.getElementById('iconTogglePassword');

function updateAuthUI() {
    const isLoggedIn = localStorage.getItem('pramuka_sordu_auth') === 'true';
    const loginLandingScreen = document.getElementById('loginLandingScreen');
    const appContainer = document.getElementById('appContainer');

    if (isLoggedIn) {
        if (loginLandingScreen) loginLandingScreen.classList.add('hidden');
        if (appContainer) appContainer.classList.remove('hidden');
        if (btnLoginNav) btnLoginNav.classList.add('hidden');
        if (userProfileArea) userProfileArea.classList.remove('hidden');
    } else {
        if (loginLandingScreen) loginLandingScreen.classList.remove('hidden');
        if (appContainer) appContainer.classList.add('hidden');
        if (btnLoginNav) btnLoginNav.classList.remove('hidden');
        if (userProfileArea) userProfileArea.classList.add('hidden');
    }
}

function checkAuthOrPrompt(callback) {
    const isLoggedIn = localStorage.getItem('pramuka_sordu_auth') === 'true';
    if (isLoggedIn) {
        if (typeof callback === 'function') callback();
    } else {
        openLoginModal();
    }
}

function openLoginModal() {
    if (modalLogin) {
        modalLogin.classList.add('active');
        if (loginAlert) loginAlert.classList.add('hidden');
        if (formLogin) formLogin.reset();
        if (loginUsername) loginUsername.focus();
    }
}

function closeLoginModal() {
    if (modalLogin) {
        modalLogin.classList.remove('active');
    }
}

// Edit Item (Protected by Auth)
window.editData = function(id) {
    checkAuthOrPrompt(() => {
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
    });
};

// Delete Item (Protected by Auth)
window.hapusData = async function(id) {
    checkAuthOrPrompt(async () => {
        if (confirm('Apakah Anda yakin ingin menghapus data latihan ini?')) {
            await DatabaseService.delete(id);
            await loadData();
        }
    });
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
    updateAuthUI();
    await initSeedData();
    await loadData();

    // Auto-polling for multi-device live sync (fetches every 3 seconds)
    setInterval(async () => {
        await loadData();
    }, 3000);

    // Auto-sync when phone screen unlocks, tab active, network online, or page shown
    ['visibilitychange', 'focus', 'online', 'pageshow'].forEach(eventType => {
        window.addEventListener(eventType, () => {
            if (!document.hidden) {
                loadData();
            }
        });
    });

    // Filters
    filterBulan.addEventListener('change', renderApp);
    filterTahunPelajaran.addEventListener('input', renderApp);
    searchQuery.addEventListener('input', renderApp);

    // Date change event
    inputTanggal.addEventListener('change', updateFormattedDateHint);

    // Navigation Auth Controls
    if (btnLoginNav) {
        btnLoginNav.addEventListener('click', openLoginModal);
    }

    if (btnLogoutNav) {
        btnLogoutNav.addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin keluar dari akun Pembina?')) {
                localStorage.removeItem('pramuka_sordu_auth');
                updateAuthUI();
            }
        });
    }

    if (btnCloseModalLogin) btnCloseModalLogin.addEventListener('click', closeLoginModal);
    if (btnBatalLogin) btnBatalLogin.addEventListener('click', closeLoginModal);

    // Toggle Password Visibility
    if (btnTogglePassword) {
        btnTogglePassword.addEventListener('click', () => {
            const isPassword = loginPassword.type === 'password';
            loginPassword.type = isPassword ? 'text' : 'password';
            iconTogglePassword.className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
        });
    }

    // Login Form Submit Handler
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = loginUsername.value.trim();
            const pass = loginPassword.value.trim();

            // Default credentials check (username: admin, password: pramukasordu)
            if ((user === 'admin' || user.toLowerCase() === 'pembina') && (pass === 'pramukasordu' || pass === 'admin123')) {
                localStorage.setItem('pramuka_sordu_auth', 'true');
                updateAuthUI();
                closeLoginModal();
            } else {
                loginAlertText.textContent = 'Username atau Password salah!';
                loginAlert.classList.remove('hidden');
            }
        });
    }

    // Modal Control (Protected Input Features)
    document.getElementById('btnTambahLatihan').addEventListener('click', () => {
        checkAuthOrPrompt(() => openModal(false));
    });
    
    document.getElementById('btnCloseModal').addEventListener('click', closeModal);
    document.getElementById('btnBatal').addEventListener('click', closeModal);
    btnCloseImageViewer.addEventListener('click', closeImageViewer);

    // Photo Input 1 Listener
    foto1.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
            try {
                placeholder1.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Memproses Foto 1...</span>';
                const base64 = await compressImage(e.target.files[0]);
                setPhotoPreview(1, base64);
            } catch (err) {
                alert('Gagal memproses gambar foto 1.');
                resetUploader(1);
            }
        }
    });

    // Photo Input 2 Listener
    foto2.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
            try {
                placeholder2.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Memproses Foto 2...</span>';
                const base64 = await compressImage(e.target.files[0]);
                setPhotoPreview(2, base64);
            } catch (err) {
                alert('Gagal memproses gambar foto 2.');
                resetUploader(2);
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

        const btnSimpan = document.getElementById('btnSimpan');
        const originalBtnHtml = btnSimpan ? btnSimpan.innerHTML : '<i class="fa-solid fa-floppy-disk"></i> Simpan Data Latihan';

        if (!inputTanggal.value) {
            alert('Tanggal Latihan belum diisi.');
            inputTanggal.focus();
            return;
        }

        if (!inputTahunPelajaran.value.trim()) {
            alert('Tahun Pelajaran belum diisi.');
            inputTahunPelajaran.focus();
            return;
        }

        if (!inputUraian.value.trim()) {
            alert('Uraian Kegiatan Latihan belum diisi.');
            inputUraian.focus();
            return;
        }

        try {
            if (btnSimpan) {
                btnSimpan.disabled = true;
                btnSimpan.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
            }

            const itemData = {
                tanggal: inputTanggal.value,
                tahunPelajaran: inputTahunPelajaran.value.trim(),
                uraian: inputUraian.value.trim(),
                foto1: tempFoto1 || DEFAULT_SCOUT_PHOTO,
                foto2: tempFoto2 || DEFAULT_SCOUT_PHOTO
            };

            if (editId.value) {
                itemData.id = editId.value;
            }

            const saveResult = await DatabaseService.save(itemData);
            closeModal();

            if (saveResult && saveResult.isCloud) {
                alert('✓ Data Latihan Berhasil Disimpan ke MongoDB Cloud!');
            } else {
                alert('✓ Data Latihan Berhasil Disimpan di Perangkat!\n\nCatatan: Untuk sinkronisasi cloud multi-perangkat (HP & Laptop), pastikan MONGODB_URI di Vercel Settings -> Environment Variables sudah diisi dengan Connection String MongoDB Atlas milik Anda.');
            }
            await loadData();
        } catch (err) {
            console.error("Gagal menyimpan data:", err);
            alert('Gagal menyimpan data: ' + (err.message || err));
        } finally {
            if (btnSimpan) {
                btnSimpan.disabled = false;
                btnSimpan.innerHTML = originalBtnHtml;
            }
        }
    });

    // PDF Download Button
    document.getElementById('btnUnduhPDF').addEventListener('click', downloadPDF);

    // Print Button
    document.getElementById('btnCetak').addEventListener('click', () => {
        window.print();
    });
    // Fullscreen Landing Login Form Submission
    const formLoginLanding = document.getElementById('formLoginLanding');
    const loginUsernameLanding = document.getElementById('loginUsernameLanding');
    const loginPasswordLanding = document.getElementById('loginPasswordLanding');
    const loginAlertLanding = document.getElementById('loginAlertLanding');
    const loginAlertTextLanding = document.getElementById('loginAlertTextLanding');
    const btnTogglePasswordLanding = document.getElementById('btnTogglePasswordLanding');
    const iconTogglePasswordLanding = document.getElementById('iconTogglePasswordLanding');

    if (btnTogglePasswordLanding) {
        btnTogglePasswordLanding.addEventListener('click', () => {
            const type = loginPasswordLanding.getAttribute('type') === 'password' ? 'text' : 'password';
            loginPasswordLanding.setAttribute('type', type);
            iconTogglePasswordLanding.className = type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
        });
    }

    if (formLoginLanding) {
        formLoginLanding.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = loginUsernameLanding.value.trim();
            const password = loginPasswordLanding.value;

            if ((username === 'admin' || username === 'pembina') && (password === 'pramukasordu' || password === 'admin123')) {
                localStorage.setItem('pramuka_sordu_auth', 'true');
                if (loginAlertLanding) loginAlertLanding.classList.add('hidden');
                formLoginLanding.reset();
                updateAuthUI();
                loadData();
            } else {
                if (loginAlertTextLanding) loginAlertTextLanding.textContent = 'Username atau Password salah!';
                if (loginAlertLanding) loginAlertLanding.classList.remove('hidden');
            }
        });
    }
});
