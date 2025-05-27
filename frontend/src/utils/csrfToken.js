// CSRF Token yönetimi - Cookie tabanlı
class CSRFTokenManager {
  constructor() {
    this.cookieName = 'csrfToken';
  }

  // Cookie'den token'ı al
  getToken() {
    return this.getCookie(this.cookieName);
  }

  // Token'ı cookie'ye kaydet
  setToken(token) {
    if (token) {
      this.setCookie(this.cookieName, token, 1); // 1 gün
      console.log('🔒 CSRF token cookie\'ye kaydedildi');
    }
  }

  // Token'ı temizle
  clearToken() {
    this.deleteCookie(this.cookieName);
    console.log('🔓 CSRF token cookie\'den temizlendi');
  }

  // Token var mı kontrol et
  hasToken() {
    return !!this.getToken();
  }

  // Response header'dan yeni token'ı al ve güncelle
  updateFromResponse(response) {
    const newToken = response.headers['x-new-csrf-token'];
    if (newToken) {
      this.setToken(newToken);
      return newToken;
    }
    return null;
  }

  // Cookie helper fonksiyonları
  setCookie(name, value, days) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Strict";
  }

  getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  deleteCookie(name) {
    document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict";
  }
}

// Singleton instance
const csrfTokenManager = new CSRFTokenManager();

export default csrfTokenManager; 