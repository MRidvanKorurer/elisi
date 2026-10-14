import i18n from '../i18n';

const msg = (key, defaultValue) => i18n.t(`validation.${key}`, { ns: 'seller', defaultValue });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[A-Za-zÇĞİÖŞÜçğıöşüÂâÊêÎîÔôÛû'\- ]{3,80}$/;
const CITY_RE = /^[A-Za-zÇĞİÖŞÜçğıöşü.\- ]{2,40}$/;
const INSTAGRAM_RE = /^@?[A-Za-z0-9._]{1,30}$/;
const WEBSITE_RE = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
const CATEGORY_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const STEP_FIELDS = {
  0: (loggedIn, hesapTipi) => {
    const fields = ['telefon', 'hesapTipi'];
    if (!loggedIn) fields.unshift('adSoyad', 'email', 'sifre');
    if (hesapTipi === 'kurumsal') fields.push('vergiNo');
    return fields;
  },
  1: () => ['magazaAdi', 'magazaTuru', 'aciklama', 'instagram', 'website'],
  2: () => ['sehir', 'ilce', 'adres', 'iban', 'sozlesmeOnay']
};

export const asMagazaTurleri = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
};

export const onlyDigits = (value = '') => String(value).replace(/\D/g, '');

export const formatIban = (value = '') => {
  const clean = String(value).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 26);
  return clean.replace(/(.{4})/g, '$1 ').trim();
};

export const sanitizeIban = (value = '') => String(value).replace(/\s+/g, '').toUpperCase();

export const isValidIbanTr = (iban) => /^TR\d{24}$/.test(sanitizeIban(iban));

export const isValidPhone = (telefon = '') => {
  const digits = onlyDigits(telefon);
  if (digits.length === 10 && digits.startsWith('5')) return true;
  if (digits.length === 11 && digits.startsWith('05')) return true;
  if (digits.length === 12 && digits.startsWith('90')) return true;
  if (digits.length === 13 && digits.startsWith('905')) return true;
  return false;
};

export const isValidTckn = (value = '') => {
  if (!/^\d{11}$/.test(value)) return false;
  if (value[0] === '0') return false;
  const d = value.split('').map(Number);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  if ((((odd * 7) - even) % 10 + 10) % 10 !== d[9]) return false;
  return d.slice(0, 10).reduce((sum, n) => sum + n, 0) % 10 === d[10];
};

export const normalizeFieldValue = (name, raw) => {
  const value = raw == null ? '' : raw;
  if (name === 'email') return String(value).trim().toLowerCase();
  if (name === 'tcKimlik' || name === 'vergiNo') return onlyDigits(value).slice(0, name === 'tcKimlik' ? 11 : 10);
  if (name === 'iban') return formatIban(value);
  if (name === 'instagram') return String(value).trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/.*$/, '');
  if (name === 'telefon') return String(value).replace(/[^\d+\s]/g, '').slice(0, 16);
  if (name === 'adSoyad' || name === 'sehir' || name === 'ilce' || name === 'magazaAdi') {
    return String(value).replace(/\s+/g, ' ');
  }
  return value;
};

export function getFieldError(name, form, { loggedIn } = {}) {
  const value = form[name];
  const text = typeof value === 'string' ? value.trim() : value;

  switch (name) {
    case 'adSoyad': {
      if (loggedIn) return '';
      if (!text) return msg('nameRequired', 'Ad soyad zorunludur.');
      if (text.length < 3) return msg('nameShort', 'Ad soyad en az 3 karakter olmalıdır.');
      if (!NAME_RE.test(text)) return msg('nameLetters', 'Ad soyad yalnızca harf içermelidir.');
      if (!text.includes(' ')) return msg('nameFull', 'Lütfen ad ve soyadı birlikte yazın.');
      return '';
    }
    case 'email': {
      if (loggedIn) return '';
      if (!text) return msg('emailRequired', 'E-posta zorunludur.');
      if (!EMAIL_RE.test(text)) return msg('emailInvalid', 'Geçerli bir e-posta adresi girin.');
      return '';
    }
    case 'sifre': {
      if (loggedIn) return '';
      if (!text) return msg('passwordRequired', 'Şifre zorunludur.');
      if (text.length < 6) return msg('passwordShort', 'Şifre en az 6 karakter olmalıdır.');
      if (text.length > 72) return msg('passwordLong', 'Şifre en fazla 72 karakter olabilir.');
      if (!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(text) || !/\d/.test(text)) {
        return msg('passwordMix', 'Şifre en az bir harf ve bir rakam içermelidir.');
      }
      return '';
    }
    case 'telefon': {
      if (!text) return msg('phoneRequired', 'Telefon numarası zorunludur.');
      if (!isValidPhone(text)) return msg('phoneInvalid', 'Geçerli bir cep telefonu girin (05xx xxx xx xx).');
      return '';
    }
    case 'vergiNo': {
      if (form.hesapTipi !== 'kurumsal') return '';
      if (!text) return msg('taxRequired', 'Vergi numarası zorunludur.');
      if (!/^\d{10}$/.test(text)) return msg('taxInvalid', 'Vergi numarası 10 haneli olmalıdır.');
      return '';
    }
    case 'magazaAdi': {
      if (!text) return msg('shopRequired', 'Mağaza adı zorunludur.');
      if (text.length < 3) return msg('shopShort', 'Mağaza adı en az 3 karakter olmalıdır.');
      if (text.length > 60) return msg('shopLong', 'Mağaza adı en fazla 60 karakter olabilir.');
      return '';
    }
    case 'magazaTuru': {
      const list = asMagazaTurleri(value);
      if (!list.length) return msg('craftRequired', 'En az bir üretim alanı seçin.');
      if (list.some((item) => !CATEGORY_ID_RE.test(item))) return msg('craftInvalid', 'Geçerli bir üretim alanı seçin.');
      return '';
    }
    case 'aciklama': {
      if (text && text.length > 1000) return msg('storyLong', 'Atölye hikâyesi en fazla 1000 karakter olabilir.');
      return '';
    }
    case 'instagram': {
      if (!text) return '';
      if (!INSTAGRAM_RE.test(text)) return msg('instagramInvalid', 'Geçerli bir Instagram kullanıcı adı girin.');
      return '';
    }
    case 'website': {
      if (!text) return '';
      if (!WEBSITE_RE.test(text)) return msg('websiteInvalid', 'Geçerli bir web adresi girin.');
      return '';
    }
    case 'sehir': {
      if (!text) return msg('cityRequired', 'Şehir zorunludur.');
      if (!CITY_RE.test(text)) return msg('cityLetters', 'Şehir adında yalnızca harf kullanın.');
      return '';
    }
    case 'ilce': {
      if (!text) return msg('districtRequired', 'İlçe zorunludur.');
      if (!CITY_RE.test(text)) return msg('districtLetters', 'İlçe adında yalnızca harf kullanın.');
      return '';
    }
    case 'adres': {
      if (!text) return msg('addressRequired', 'Açık adres zorunludur.');
      if (text.length < 10) return msg('addressShort', 'Adres en az 10 karakter olmalıdır.');
      if (text.length > 250) return msg('addressLong', 'Adres en fazla 250 karakter olabilir.');
      return '';
    }
    case 'iban': {
      if (!text) return msg('ibanRequired', 'IBAN zorunludur.');
      if (!isValidIbanTr(text)) return msg('ibanInvalid', 'Geçerli bir TR IBAN girin (TR + 24 hane).');
      return '';
    }
    case 'sozlesmeOnay': {
      if (!value) return msg('agreementRequired', 'Satıcı sözleşmesini onaylamanız gerekir.');
      return '';
    }
    default:
      return '';
  }
}

export function validateFields(names, form, options) {
  const errors = {};
  names.forEach((name) => {
    const message = getFieldError(name, form, options);
    if (message) errors[name] = message;
  });
  return errors;
}

export function firstErrorMessage(errors) {
  return Object.values(errors).find(Boolean) || '';
}

export function mapServerErrorToField(message = '') {
  const text = message.toLowerCase();
  if (text.includes('e-posta') || text.includes('email')) return 'email';
  if (text.includes('iban')) return 'iban';
  if (text.includes('telefon') || text.includes('phone')) return 'telefon';
  if (text.includes('mağaza adı') || text.includes('magaza') || text.includes('shop name')) return 'magazaAdi';
  if (text.includes('kimlik')) return 'tcKimlik';
  if (text.includes('vergi') || text.includes('tax')) return 'vergiNo';
  if (text.includes('sözleşme') || text.includes('sozlesme') || text.includes('agreement')) return 'sozlesmeOnay';
  if (text.includes('şifre') || text.includes('sifre') || text.includes('password')) return 'sifre';
  if (text.includes('üretim') || text.includes('tür')) return 'magazaTuru';
  return '';
}
