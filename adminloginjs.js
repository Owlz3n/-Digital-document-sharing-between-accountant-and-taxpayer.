let currentData = [];
let config = {};

const defaultConfig = {
  form_baslik: "Kayıt Formu",
  alt_baslik: "Bilgilerinizi girin ve kayıt olun",
  buton_metni: "Kayıt Ol",
  basari_mesaji: "Kayıt başarıyla tamamlandı! Hoş geldiniz.",
  background_color: "#667eea",
  surface_color: "#ffffff",
  text_color: "#2d3748",
  primary_action_color: "#667eea",
  secondary_action_color: "#718096",
  font_family: "Segoe UI",
  font_size: 16
};

const dataHandler = {
  onDataChanged(data) {
    currentData = data;
    console.log('Kayıtlı kullanıcı sayısı:', data.length);
  }
};

async function onConfigChange(newConfig) {
  config = newConfig;

  // Metin içeriklerini güncelle
  const titleElement = document.getElementById('form-title');
  const subtitleElement = document.getElementById('form-subtitle');
  const btnTextElement = document.getElementById('btn-text');
  const successElement = document.getElementById('success-message');

  if (titleElement) titleElement.textContent = config.form_baslik || defaultConfig.form_baslik;
  if (subtitleElement) subtitleElement.textContent = config.alt_baslik || defaultConfig.alt_baslik;
  if (btnTextElement) btnTextElement.textContent = config.buton_metni || defaultConfig.buton_metni;
  if (successElement) successElement.textContent = config.basari_mesaji || defaultConfig.basari_mesaji;

  // Renkleri güncelle
  const backgroundColor = config.background_color || defaultConfig.background_color;
  const surfaceColor = config.surface_color || defaultConfig.surface_color;
  const textColor = config.text_color || defaultConfig.text_color;
  const primaryColor = config.primary_action_color || defaultConfig.primary_action_color;
  const secondaryColor = config.secondary_action_color || defaultConfig.secondary_action_color;

  document.body.style.background = `linear-gradient(135deg, ${backgroundColor} 0%, #764ba2 100%)`;
  document.querySelector('.container').style.backgroundColor = surfaceColor;
  document.querySelector('.title').style.color = textColor;
  document.querySelector('.subtitle').style.color = secondaryColor;

  const labels = document.querySelectorAll('label');
  labels.forEach(label => {
    if (!label.classList.contains('checkbox-label')) {
      label.style.color = textColor;
    }
  });

  const submitBtn = document.querySelector('.submit-btn');
  submitBtn.style.background = `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`;

  // Font ayarları
  const customFont = config.font_family || defaultConfig.font_family;
  const baseFontSize = config.font_size || defaultConfig.font_size;
  const fontStack = `${customFont}, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`;

  document.body.style.fontFamily = fontStack;
  document.querySelector('.title').style.fontSize = `${baseFontSize * 2}px`;
  document.querySelector('.subtitle').style.fontSize = `${baseFontSize}px`;

  const inputs = document.querySelectorAll('input, select');
  inputs.forEach(input => {
    input.style.fontSize = `${baseFontSize}px`;
  });

  const submitButton = document.querySelector('.submit-btn');
  submitButton.style.fontSize = `${baseFontSize * 1.125}px`;
}

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

async function handleFormSubmit(event) {
  event.preventDefault();

  // Limit kontrolü
  if (currentData.length >= 999) {
    showError('Maksimum 999 kayıt limitine ulaşıldı. Lütfen daha sonra tekrar deneyin.');
    return;
  }

  const formData = new FormData(event.target);
  const submitBtn = document.getElementById('submit-btn');
  const btnText = document.getElementById('btn-text');
  const loading = document.getElementById('loading');

  // Loading durumu
  submitBtn.disabled = true;
  btnText.style.display = 'none';
  loading.style.display = 'flex';

  try {
    const kayitData = {
      id: generateId(),
      ad: formData.get('ad').trim(),
      soyad: formData.get('soyad').trim(),
      email: formData.get('email').trim(),
      telefon: formData.get('telefon')?.trim() || '',
      sehir: formData.get('sehir') || '',
      haber_bulteni: formData.has('haber-bulteni'),
      kayit_tarihi: new Date().toISOString()
    };

    const result = await window.dataSdk.create(kayitData);

    if (result.isOk) {
      showSuccess();
      document.getElementById('kayit-formu').reset();
    } else {
      showError('Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    }
  } catch (error) {
    showError('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
  } finally {
    // Loading durumunu kaldır
    submitBtn.disabled = false;
    btnText.style.display = 'inline';
    loading.style.display = 'none';
  }
}

function showSuccess() {
  const successMsg = document.getElementById('success-message');
  const errorMsg = document.getElementById('error-message');

  errorMsg.style.display = 'none';
  successMsg.style.display = 'block';

  setTimeout(() => {
    successMsg.style.display = 'none';
  }, 5000);
}

function showError(message) {
  const errorMsg = document.getElementById('error-message');
  const successMsg = document.getElementById('success-message');

  successMsg.style.display = 'none';
  errorMsg.textContent = message;
  errorMsg.style.display = 'block';

  setTimeout(() => {
    errorMsg.style.display = 'none';
  }, 5000);
}

// SDK'ları başlat
document.addEventListener('DOMContentLoaded', async () => {
  // Data SDK'yı başlat
  if (window.dataSdk) {
    const initResult = await window.dataSdk.init(dataHandler);
    if (!initResult.isOk) {
      console.error('Data SDK başlatılamadı');
    }
  }

  // Element SDK'yı başlat
  if (window.elementSdk) {
    await window.elementSdk.init({
      defaultConfig,
      onConfigChange,
      mapToCapabilities: (config) => ({
        recolorables: [
          {
            get: () => config.background_color || defaultConfig.background_color,
            set: (value) => {
              config.background_color = value;
              window.elementSdk.setConfig({ background_color: value });
            }
          },
          {
            get: () => config.surface_color || defaultConfig.surface_color,
            set: (value) => {
              config.surface_color = value;
              window.elementSdk.setConfig({ surface_color: value });
            }
          },
          {
            get: () => config.text_color || defaultConfig.text_color,
            set: (value) => {
              config.text_color = value;
              window.elementSdk.setConfig({ text_color: value });
            }
          },
          {
            get: () => config.primary_action_color || defaultConfig.primary_action_color,
            set: (value) => {
              config.primary_action_color = value;
              window.elementSdk.setConfig({ primary_action_color: value });
            }
          },
          {
            get: () => config.secondary_action_color || defaultConfig.secondary_action_color,
            set: (value) => {
              config.secondary_action_color = value;
              window.elementSdk.setConfig({ secondary_action_color: value });
            }
          }
        ],
        borderables: [],
        fontEditable: {
          get: () => config.font_family || defaultConfig.font_family,
          set: (value) => {
            config.font_family = value;
            window.elementSdk.setConfig({ font_family: value });
          }
        },
        fontSizeable: {
          get: () => config.font_size || defaultConfig.font_size,
          set: (value) => {
            config.font_size = value;
            window.elementSdk.setConfig({ font_size: value });
          }
        }
      }),
      mapToEditPanelValues: (config) => new Map([
        ["form_baslik", config.form_baslik || defaultConfig.form_baslik],
        ["alt_baslik", config.alt_baslik || defaultConfig.alt_baslik],
        ["buton_metni", config.buton_metni || defaultConfig.buton_metni],
        ["basari_mesaji", config.basari_mesaji || defaultConfig.basari_mesaji]
      ])
    });

    config = window.elementSdk.config;
  }

  // Form submit event listener
  document.getElementById('kayit-formu').addEventListener('submit', handleFormSubmit);
});