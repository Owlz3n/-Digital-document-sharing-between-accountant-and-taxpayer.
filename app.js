let invoices = [];
let currentRecordCount = 0;

const defaultConfig = {
    app_title: "Finans Yöneticisi",
    currency_symbol: "₺",
    welcome_message: "Finanslarınızı kolayca yönetin"
};

const dataHandler = {
    onDataChanged(data) {
        invoices = data;
        currentRecordCount = data.length;
        
        // Hangi sayfada olursak olalım, veriler değiştiğinde
        // ilgili fonksiyonları çalıştırmayı dene.
        // Fonksiyonların içindeki kontroller (örn. if (!element))
        // sadece ilgili sayfada işlem yapılmasını sağlayacak.
        updateStatistics();
        renderRecentInvoices();
        renderInvoicesList();
    }
};

async function onConfigChange(config) {
    const appTitle = config.app_title || defaultConfig.app_title;
    const currencySymbol = config.currency_symbol || defaultConfig.currency_symbol;
    const welcomeMessage = config.welcome_message || defaultConfig.welcome_message;

    // Elementlerin varlığını kontrol et (her sayfada olmayabilirler)
    const appTitleEl = document.getElementById('app-title');
    const currencyDisplayEl = document.getElementById('currency-display');
    const welcomeMessageEl = document.getElementById('welcome-message');

    if (appTitleEl) appTitleEl.textContent = appTitle;
    if (currencyDisplayEl) currencyDisplayEl.textContent = currencySymbol;
    if (welcomeMessageEl) welcomeMessageEl.textContent = welcomeMessage;

    // Para birimi değiştiğinde istatistikleri güncelle
    updateStatistics();
}

function mapToCapabilities(config) {
    return {
        recolorables: [
            {
                get: () => config.primary_color || "#4f46e5",
                set: (value) => {
                    if (window.elementSdk) {
                        window.elementSdk.setConfig({ primary_color: value });
                    }
                }
            }
        ],
        borderables: [],
        fontEditable: undefined,
        fontSizeable: undefined
    };
}

function mapToEditPanelValues(config) {
    return new Map([
        ["app_title", config.app_title || defaultConfig.app_title],
        ["currency_symbol", config.currency_symbol || defaultConfig.currency_symbol],
        ["welcome_message", config.welcome_message || defaultConfig.welcome_message]
    ]);
}

async function initializeApp() {
    // Initialize Data SDK
    if (window.dataSdk) {
        const initResult = await window.dataSdk.init(dataHandler);
        if (!initResult.isOk) {
            console.error("Data SDK initialization failed");
        }
    }

    // Initialize Element SDK
    if (window.elementSdk) {
        await window.elementSdk.init({
            defaultConfig,
            onConfigChange,
            mapToCapabilities,
            mapToEditPanelValues
        });
    }

    // Hangi sayfada olduğumuzu algıla ve navigasyonu güncelle
    updateActiveNav();

    // ==========================================================
    // SAYFAYA ÖZEL BAŞLATMA KODLARI
    // ==========================================================

    // Fatura Ekle Sayfasındaysak...
    const invoiceForm = document.getElementById('invoice-form');
    if (invoiceForm) {
        // Tarih alanını bugüne ayarla
        document.getElementById('invoice-date').value = new Date().toISOString().split('T')[0];
        // Form gönderim dinleyicisini ekle
        invoiceForm.addEventListener('submit', onInvoiceFormSubmit);
    }

    // Faturalarım Sayfasındaysak...
    const filterStatusEl = document.getElementById('filter-status');
    if (filterStatusEl) {
        // Filtre dinleyicisini ekle
        filterStatusEl.addEventListener('change', renderInvoicesList);
    }
}

// YENİ FONKSİYON: Aktif navigasyon butonunu günceller
function updateActiveNav() {
    // Mevcut sayfanın dosya adını al (örn: "ekle.html")
    const currentPageFile = window.location.pathname.split('/').pop();

    let activePageId = 'home'; // Varsayılan

    if (currentPageFile === 'index.html' || currentPageFile === '') {
        activePageId = 'home';
    } else if (currentPageFile === 'ekle.html') {
        activePageId = 'add-invoice';
    } else if (currentPageFile === 'faturalar.html') {
        activePageId = 'invoices';
    } else if (currentPageFile === 'ayarlar.html') {
        activePageId = 'settings';
    }
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-indigo-600', 'bg-indigo-50');
        btn.classList.add('text-gray-600');
    });

    const activeBtn = document.querySelector(`[data-page="${activePageId}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-600');
        activeBtn.classList.add('text-indigo-600', 'bg-indigo-50');
    }
}

function updateStatistics() {
    // Bu elementler sadece ana sayfada var. Kontrol et.
    const totalInvoicesEl = document.getElementById('total-invoices');
    const totalAmountEl = document.getElementById('total-amount');
    const pendingInvoicesEl = document.getElementById('pending-invoices');

    // Eğer elementler sayfada yoksa, fonksiyondan çık
    if (!totalInvoicesEl || !totalAmountEl || !pendingInvoicesEl) {
        return;
    }

    const currencySymbol = (window.elementSdk?.config?.currency_symbol) || defaultConfig.currency_symbol;
    
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const pendingInvoices = invoices.filter(invoice => invoice.status === 'Bekliyor').length;

    totalInvoicesEl.textContent = totalInvoices;
    totalAmountEl.textContent = `${currencySymbol}${totalAmount.toFixed(2)}`;
    pendingInvoicesEl.textContent = pendingInvoices;
}

function renderRecentInvoices() {
    // Bu element sadece ana sayfada var. Kontrol et.
    const container = document.getElementById('recent-invoices');
    if (!container) return;

    const recentInvoices = invoices.slice(-3).reverse();

    if (recentInvoices.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p>Henüz fatura eklenmemiş</p>
            </div>
        `;
        return;
    }

    const currencySymbol = (window.elementSdk?.config?.currency_symbol) || defaultConfig.currency_symbol;
    
    container.innerHTML = recentInvoices.map(invoice => `
        <div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
            <div class="flex-1">
                <h4 class="font-medium text-gray-800">${invoice.title}</h4>
                <p class="text-sm text-gray-600">${invoice.category} • ${new Date(invoice.date).toLocaleDateString('tr-TR')}</p>
            </div>
            <div class="text-right">
                <p class="font-semibold text-gray-800">${currencySymbol}${invoice.amount.toFixed(2)}</p>
                <span class="inline-block px-2 py-1 text-xs rounded-full ${invoice.status === 'Ödendi' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}">
                    ${invoice.status}
                </span>
            </div>
        </div>
    `).join('');
}

function renderInvoicesList() {
    // Bu element sadece faturalarım sayfasında var. Kontrol et.
    const container = document.getElementById('invoices-list');
    const filterStatusEl = document.getElementById('filter-status');
    
    if (!container || !filterStatusEl) return;

    const filterStatus = filterStatusEl.value;
    
    let filteredInvoices = invoices.sort((a, b) => new Date(b.date) - new Date(a.date)); // En yeniden eskiye sırala
    if (filterStatus) {
        filteredInvoices = filteredInvoices.filter(invoice => invoice.status === filterStatus);
    }

    if (filteredInvoices.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p>Henüz fatura bulunmuyor</p>
            </div>
        `;
        return;
    }

    const currencySymbol = (window.elementSdk?.config?.currency_symbol) || defaultConfig.currency_symbol;
    
    container.innerHTML = `
        <div class="space-y-3">
            ${filteredInvoices.map(invoice => `
                <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-semibold text-gray-800">${invoice.title}</h3>
                        <button onclick="deleteInvoice('${invoice.__backendId}')" class="text-red-600 hover:text-red-800 p-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="flex items-center justify-between text-sm text-gray-600">
                        <span>${invoice.category}</span>
                        <span>${new Date(invoice.date).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <div class="flex items-center justify-between mt-2">
                        <span class="text-lg font-semibold text-gray-800">${currencySymbol}${invoice.amount.toFixed(2)}</span>
                        <span class="inline-block px-2 py-1 text-xs rounded-full ${invoice.status === 'Ödendi' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}">
                            ${invoice.status}
                        </span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

async function deleteInvoice(backendId) {
    const invoice = invoices.find(inv => inv.__backendId === backendId);
    if (!invoice || !window.dataSdk) return;

    const deleteResult = await window.dataSdk.delete(invoice);
    if (deleteResult.isOk) {
        showToast('Fatura silindi');
    } else {
        showToast('Silme işlemi başarısız', 'error');
    }
}

// Form submit fonksiyonunu ayırdık
async function onInvoiceFormSubmit(e) {
    e.preventDefault();
    
    if (currentRecordCount >= 999) {
        showToast('Maksimum 999 fatura sınırına ulaşıldı. Lütfen önce bazı faturaları silin.', 'error');
        return;
    }

    const saveBtn = document.getElementById('save-invoice-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Kaydediliyor...';

    const formData = new FormData(e.target);
    const invoiceData = {
        id: Date.now().toString(),
        title: formData.get('title'),
        amount: parseFloat(formData.get('amount')),
        date: formData.get('date'),
        category: formData.get('category'),
        status: formData.get('status'),
        createdAt: new Date().toISOString()
    };

    if (window.dataSdk) {
        const createResult = await window.dataSdk.create(invoiceData);
        if (createResult.isOk) {
            showToast('Fatura başarıyla eklendi');
            e.target.reset();
            document.getElementById('invoice-date').value = new Date().toISOString().split('T')[0];
            // Kaydettikten sonra Ana Sayfa'ya yönlendir
            window.location.href = 'index.html';
        } else {
            showToast('Fatura eklenirken hata oluştu', 'error');
        }
    }

    saveBtn.disabled = false;
    saveBtn.textContent = 'Kaydet';
}

function showDeleteConfirmation() {
    document.getElementById('delete-modal').classList.remove('hidden');
    document.getElementById('delete-modal').classList.add('flex');
}

function hideDeleteConfirmation() {
    document.getElementById('delete-modal').classList.add('hidden');
    document.getElementById('delete-modal').classList.remove('flex');
}

async function deleteAllData() {
    if (!window.dataSdk) return;

    // Kopyasını alarak döngüde silme (orijinal array değişirken sorun yaşamamak için)
    const allInvoices = [...invoices]; 
    for (const invoice of allInvoices) {
        await window.dataSdk.delete(invoice);
    }
    
    hideDeleteConfirmation();
    showToast('Tüm veriler silindi');
}

function exportData() {
    if (invoices.length === 0) {
        showToast('Dışa aktarılacak veri bulunmuyor', 'error');
        return;
    }

    const dataStr = JSON.stringify(invoices, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'faturalar.json';
    link.click();
    URL.revokeObjectURL(url);
    
    showToast('Veriler dışa aktarıldı');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    toast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', initializeApp);