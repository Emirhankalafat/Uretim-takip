const nodemailer = require('nodemailer');
require('dotenv').config();

// Environment kontrolü
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Email ayarlarının varlığını kontrol et
const isEmailConfigured = () => {
  return process.env.EMAIL_USER && process.env.EMAIL_PASS;
};

// Email transporter oluştur
const createTransporter = () => {
  if (!isEmailConfigured()) {
    console.warn('Email ayarları yapılandırılmamış. EMAIL_USER ve EMAIL_PASS environment variables gerekli.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Environment'a göre base URL belirle
const getBaseUrl = () => {
  if (isDevelopment) {
    return process.env.FRONTEND_URL || 'http://localhost:5173';
  } else if (isProduction) {
    return process.env.FRONTEND_URL || 'https://üretimgo.com';
  }
  return 'http://localhost:5173';
};

// Environment'a göre tema renkleri
const getThemeColors = () => {
  if (isDevelopment) {
    return {
      primary: '#ef4444', // Kırmızı - Development için
      primaryDark: '#dc2626',
      gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
      bgGradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
      badge: '🔧 DEV',
      badgeColor: '#fef3c7',
      badgeBorder: '#f59e0b',
      badgeText: '#92400e'
    };
  } else if (isProduction) {
    return {
      primary: '#10b981', // Yeşil - Production için
      primaryDark: '#059669',
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      bgGradient: 'linear-gradient(135deg, #10b981, #059669)',
      badge: '🚀 PROD',
      badgeColor: '#dcfce7',
      badgeBorder: '#10b981',
      badgeText: '#065f46'
    };
  }
  // Default (development benzeri)
  return {
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    bgGradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    badge: '🔄 TEST',
    badgeColor: '#dbeafe',
    badgeBorder: '#3b82f6',
    badgeText: '#1e40af'
  };
};

// Environment badge component
const getEnvironmentBadge = () => {
  const colors = getThemeColors();
  return `
    <div style="background: ${colors.badgeColor}; border: 1px solid ${colors.badgeBorder}; padding: 8px 12px; border-radius: 20px; display: inline-block; margin-bottom: 16px;">
      <span style="color: ${colors.badgeText}; font-size: 12px; font-weight: 600;">
        ${colors.badge} Environment
      </span>
    </div>
  `;
};

// Confirm email gönder
const sendConfirmEmail = async (userEmail, userName, confirmToken) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.warn('Email transporter oluşturulamadı. Email ayarları kontrol edin.');
      return false;
    }
    
    const baseUrl = getBaseUrl();
    // E-mail'deki link backend API endpoint'ine gitmeli
    const backendUrl = isDevelopment 
      ? `http://localhost:${process.env.PORT || 3001}`
      : `${process.env.BACKEND_URL || baseUrl}`;
    const confirmUrl = `${backendUrl}/api/auth/confirm?token=${confirmToken}`;
    
    // Debug log'ları
    console.log('🔍 Email Debug:', {
      environment: process.env.NODE_ENV,
      baseUrl: baseUrl,
      backendUrl: backendUrl,
      frontendUrl: process.env.FRONTEND_URL,
      confirmUrl: confirmUrl,
      userEmail: userEmail
    });
    
    const colors = getThemeColors();
    const environmentBadge = getEnvironmentBadge();
    
    // Environment'a göre özel mesajlar
    const environmentMessage = isDevelopment 
      ? `
        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
          <p style="color: #92400e; font-size: 14px; margin: 0; display: flex; align-items: center;">
            <span style="margin-right: 8px;">🔧</span>
            <strong>Development Ortamı:</strong> Bu email test amaçlıdır. Gerçek üretim sistemi değildir.
          </p>
        </div>
      `
      : '';

    const subject = isDevelopment 
      ? '[DEV] Hesap Doğrulama - Üretim Takip Sistemi'
      : 'Hesap Doğrulama - Üretim Takip Sistemi';
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: subject,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: ${colors.bgGradient}; padding: 40px 20px; border-radius: 20px;">
          <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              ${environmentBadge}
              <div style="width: 64px; height: 64px; background: ${colors.gradient}; border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h1 style="color: #1f2937; font-size: 28px; font-weight: bold; margin: 0;">Hoş Geldiniz ${userName}!</h1>
              <p style="color: #6b7280; font-size: 16px; margin: 10px 0 0;">Üretim Takip Sistemi</p>
              ${isDevelopment ? '<p style="color: #ef4444; font-size: 12px; font-weight: 600;">DEVELOPMENT ENVIRONMENT</p>' : ''}
            </div>
            
            ${environmentMessage}
            
            <div style="background: #f9fafb; padding: 24px; border-radius: 12px; margin: 24px 0;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                Hesabınız başarıyla oluşturuldu! Sistemi kullanmaya başlamak için hesabınızı doğrulamanız gerekiyor.
              </p>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${confirmUrl}" 
                 style="background: ${colors.gradient}; color: white; padding: 16px 32px; 
                        text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; 
                        font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transition: all 0.2s;">
                ✓ Hesabımı Doğrula
              </a>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <p style="color: #92400e; font-size: 14px; margin: 0; display: flex; align-items: center;">
                <span style="margin-right: 8px;">⚠️</span>
                Bu doğrulama linki 24 saat geçerlidir. Eğer bu işlemi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.
              </p>
            </div>
            
            ${isDevelopment ? `
              <div style="background: #f3f4f6; border: 1px solid #d1d5db; padding: 16px; border-radius: 8px; margin: 24px 0;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                  <strong>Development Info:</strong><br>
                  Base URL: ${baseUrl}<br>
                  Environment: ${process.env.NODE_ENV}<br>
                  Token: ${confirmToken}
                </p>
              </div>
            ` : ''}
            
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <div style="text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0;">
                © 2024 Üretim Takip Sistemi. Tüm hakları saklıdır.
              </p>
              ${isDevelopment ? '<p style="color: #ef4444; font-size: 10px; margin: 4px 0 0;">Development Environment - Test Email</p>' : ''}
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Confirm email gönderildi [${process.env.NODE_ENV?.toUpperCase()}]:`, userEmail);
    return true;
  } catch (error) {
    console.error('Email gönderme hatası:', error);
    return false;
  }
};

// Invite email gönder
const sendInviteEmail = async (userEmail, companyName, inviteToken) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.warn('Email transporter oluşturulamadı. Email ayarları kontrol edin.');
      return false;
    }
    
    const baseUrl = getBaseUrl();
    const inviteUrl = `${baseUrl}/auth/accept-invite?token=${inviteToken}`;
    const colors = getThemeColors();
    const environmentBadge = getEnvironmentBadge();
    
    // Environment'a göre özel mesajlar
    const environmentMessage = isDevelopment 
      ? `
        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
          <p style="color: #92400e; font-size: 14px; margin: 0; display: flex; align-items: center;">
            <span style="margin-right: 8px;">🔧</span>
            <strong>Development Ortamı:</strong> Bu davet test amaçlıdır. Gerçek üretim sistemi değildir.
          </p>
        </div>
      `
      : '';

    const subject = isDevelopment 
      ? `[DEV] ${companyName} - Davet`
      : `${companyName} - Davet`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: subject,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: ${colors.bgGradient}; padding: 40px 20px; border-radius: 20px;">
          <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              ${environmentBadge}
              <div style="width: 64px; height: 64px; background: ${colors.gradient}; border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
                  <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                </svg>
              </div>
              <h1 style="color: #1f2937; font-size: 28px; font-weight: bold; margin: 0;">Davet Aldınız! 🎉</h1>
              <p style="color: #6b7280; font-size: 16px; margin: 10px 0 0;">Üretim Takip Sistemi</p>
              ${isDevelopment ? '<p style="color: #ef4444; font-size: 12px; font-weight: 600;">DEVELOPMENT ENVIRONMENT</p>' : ''}
            </div>
            
            ${environmentMessage}
            
            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 24px; border-radius: 12px; margin: 24px 0;">
              <h3 style="color: #0c4a6e; font-size: 18px; font-weight: 600; margin: 0 0 12px;">
                🏢 ${companyName}
              </h3>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                <strong>${companyName}</strong> şirketine katılmaya davet edildiniz! Üretim Takip Sistemi'nde hesap oluşturmak için aşağıdaki butona tıklayın.
              </p>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${inviteUrl}" 
                 style="background: ${colors.gradient}; color: white; padding: 16px 32px; 
                        text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; 
                        font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transition: all 0.2s;">
                🚀 Daveti Kabul Et
              </a>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <p style="color: #92400e; font-size: 14px; margin: 0; display: flex; align-items: center;">
                <span style="margin-right: 8px;">⏰</span>
                Bu davet 7 gün geçerlidir. Eğer bu daveti siz beklemiyorsanız, bu emaili görmezden gelebilirsiniz.
              </p>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
              <h4 style="color: #374151; font-size: 16px; font-weight: 600; margin: 0 0 12px;">Sonraki Adımlar:</h4>
              <ol style="color: #6b7280; font-size: 14px; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Daveti kabul et butonuna tıklayın</li>
                <li style="margin-bottom: 8px;">Adınızı ve şifrenizi girin</li>
                <li style="margin-bottom: 8px;">Email adresinizi doğrulayın</li>
                <li>Sisteme giriş yapın ve çalışmaya başlayın!</li>
              </ol>
            </div>
            
            ${isDevelopment ? `
              <div style="background: #f3f4f6; border: 1px solid #d1d5db; padding: 16px; border-radius: 8px; margin: 24px 0;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                  <strong>Development Info:</strong><br>
                  Base URL: ${baseUrl}<br>
                  Environment: ${process.env.NODE_ENV}<br>
                  Token: ${inviteToken}
                </p>
              </div>
            ` : ''}
            
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <div style="text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0;">
                © 2024 Üretim Takip Sistemi. Tüm hakları saklıdır.
              </p>
              ${isDevelopment ? '<p style="color: #ef4444; font-size: 10px; margin: 4px 0 0;">Development Environment - Test Email</p>' : ''}
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Invite email gönderildi [${process.env.NODE_ENV?.toUpperCase()}]:`, userEmail);
    return true;
  } catch (error) {
    console.error('Invite email gönderme hatası:', error);
    return false;
  }
};

// Password reset email gönder
const sendPasswordResetEmail = async (userEmail, userName, resetToken) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.warn('Email transporter oluşturulamadı. Email ayarları kontrol edin.');
      return false;
    }
    
    const baseUrl = getBaseUrl();
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    const colors = getThemeColors();
    const environmentBadge = getEnvironmentBadge();
    
    // Environment'a göre özel mesajlar
    const environmentMessage = isDevelopment 
      ? `
        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
          <p style="color: #92400e; font-size: 14px; margin: 0; display: flex; align-items: center;">
            <span style="margin-right: 8px;">🔧</span>
            <strong>Development Ortamı:</strong> Bu email test amaçlıdır. Gerçek üretim sistemi değildir.
          </p>
        </div>
      `
      : '';

    const subject = isDevelopment 
      ? '[DEV] Şifre Sıfırlama - Üretim Takip Sistemi'
      : 'Şifre Sıfırlama - Üretim Takip Sistemi';
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: subject,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: ${colors.bgGradient}; padding: 40px 20px; border-radius: 20px;">
          <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              ${environmentBadge}
              <div style="width: 64px; height: 64px; background: ${colors.gradient}; border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
                  <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
              </div>
              <h1 style="color: #1f2937; font-size: 28px; font-weight: bold; margin: 0;">Şifre Sıfırlama</h1>
              <p style="color: #6b7280; font-size: 16px; margin: 10px 0 0;">Üretim Takip Sistemi</p>
              ${isDevelopment ? '<p style="color: #ef4444; font-size: 12px; font-weight: 600;">DEVELOPMENT ENVIRONMENT</p>' : ''}
            </div>
            
            ${environmentMessage}
            
            <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 24px; border-radius: 12px; margin: 24px 0;">
              <h3 style="color: #991b1b; font-size: 18px; font-weight: 600; margin: 0 0 12px;">
                🔒 Merhaba ${userName}
              </h3>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                Hesabınız için şifre sıfırlama talebinde bulundunuz. Yeni şifrenizi belirlemek için aşağıdaki butona tıklayın.
              </p>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" 
                 style="background: ${colors.gradient}; color: white; padding: 16px 32px; 
                        text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; 
                        font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transition: all 0.2s;">
                🔑 Şifremi Sıfırla
              </a>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <p style="color: #92400e; font-size: 14px; margin: 0; display: flex; align-items: center;">
                <span style="margin-right: 8px;">⚠️</span>
                Bu şifre sıfırlama linki 1 saat geçerlidir. Eğer bu işlemi siz yapmadıysanız, hesabınızın güvenliği için destek ekibimizle iletişime geçin.
              </p>
            </div>
            
            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 20px; border-radius: 8px; margin: 24px 0;">
              <h4 style="color: #0c4a6e; font-size: 16px; font-weight: 600; margin: 0 0 12px;">Güvenlik İpuçları:</h4>
              <ul style="color: #6b7280; font-size: 14px; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Güçlü bir şifre seçin (en az 8 karakter)</li>
                <li style="margin-bottom: 8px;">Büyük-küçük harf, sayı ve özel karakter kullanın</li>
                <li style="margin-bottom: 8px;">Şifrenizi kimseyle paylaşmayın</li>
                <li>Düzenli olarak şifrenizi güncelleyin</li>
              </ul>
            </div>
            
            ${isDevelopment ? `
              <div style="background: #f3f4f6; border: 1px solid #d1d5db; padding: 16px; border-radius: 8px; margin: 24px 0;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                  <strong>Development Info:</strong><br>
                  Base URL: ${baseUrl}<br>
                  Environment: ${process.env.NODE_ENV}<br>
                  Token: ${resetToken}
                </p>
              </div>
            ` : ''}
            
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <div style="text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0;">
                © 2024 Üretim Takip Sistemi. Tüm hakları saklıdır.
              </p>
              ${isDevelopment ? '<p style="color: #ef4444; font-size: 10px; margin: 4px 0 0;">Development Environment - Test Email</p>' : ''}
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email gönderildi [${process.env.NODE_ENV?.toUpperCase()}]:`, userEmail);
    return true;
  } catch (error) {
    console.error('Password reset email gönderme hatası:', error);
    return false;
  }
};

// Ödeme başarılı email gönder
const sendPaymentSuccessEmail = async (userEmail, userName, price, endDate, cardInfo = null, isRenewal = false, companyName = '') => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.warn('Email transporter oluşturulamadı. Email ayarları kontrol edin.');
      return false;
    }
    const colors = getThemeColors();
    const environmentBadge = getEnvironmentBadge();
    const subject = isDevelopment
      ? `[DEV] ${companyName} - Premium Üyelik Başarılı`
      : `${companyName} - Premium Üyelik Başarılı`;
    let cardHtml = '';
    if (cardInfo && cardInfo.lastFour && cardInfo.cardType) {
      cardHtml = `
        <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 16px; border-radius: 12px; margin: 24px 0;">
          <h4 style="color: #0c4a6e; font-size: 16px; font-weight: 600; margin: 0 0 12px;">Kayıtlı Kart Bilgisi</h4>
          <p style="color: #374151; font-size: 15px; margin: 0;">
            Kart: <strong>${cardInfo.cardType}</strong> **** **** **** <strong>${cardInfo.lastFour}</strong><br/>
            Kart Takma Adı: <strong>${cardInfo.cardAlias || ''}</strong>
          </p>
        </div>
      `;
    }
    const mainMessage = isRenewal
      ? `Şirketiniz (${companyName}) için premium üyelik başarıyla <b>yenilendi</b>.`
      : `Şirketiniz (${companyName}) için premium üyelik <b>aktifleştirildi</b>.`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: subject,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: ${colors.bgGradient}; padding: 40px 20px; border-radius: 20px;">
          <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              ${environmentBadge}
              <div style="width: 64px; height: 64px; background: ${colors.gradient}; border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h1 style="color: #1f2937; font-size: 28px; font-weight: bold; margin: 0;">${companyName} - Premium Üyelik</h1>
              <p style="color: #6b7280; font-size: 16px; margin: 10px 0 0;">Üretim Takip Sistemi</p>
              ${isDevelopment ? '<p style="color: #ef4444; font-size: 12px; font-weight: 600;">DEVELOPMENT ENVIRONMENT</p>' : ''}
            </div>
            <div style="background: #f9fafb; padding: 24px; border-radius: 12px; margin: 24px 0;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                Sayın <strong>${userName}</strong>,<br><br>
                Ödemeniz başarıyla alınmıştır. ${mainMessage}<br>
                <strong>Ödenen Tutar:</strong> ${price} TL<br>
                <strong>Bir sonraki ödeme/yenileme tarihi:</strong> ${endDate ? new Date(endDate).toLocaleDateString('tr-TR') : '-'}
              </p>
            </div>
            ${cardHtml}
            <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <p style="color: #92400e; font-size: 14px; margin: 0; display: flex; align-items: center;">
                <span style="margin-right: 8px;">🎉</span>
                Şirketinizin premium üyeliği ile tüm özelliklerden yararlanabilirsiniz.
              </p>
            </div>
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            <div style="text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0;">
                © 2024 Üretim Takip Sistemi. Tüm hakları saklıdır.
              </p>
              ${isDevelopment ? '<p style="color: #ef4444; font-size: 10px; margin: 4px 0 0;">Development Environment - Test Email</p>' : ''}
            </div>
          </div>
        </div>
      `
    };
    await transporter.sendMail(mailOptions);
    console.log(`Ödeme başarılı email gönderildi [${process.env.NODE_ENV?.toUpperCase()}]:`, userEmail);
    return true;
  } catch (error) {
    console.error('Ödeme başarılı email gönderme hatası:', error);
    return false;
  }
};

// Abonelik bitişi yaklaşan şirketler için superadmin'e uyarı maili gönder
const sendSubscriptionReminderEmail = async (adminEmail, adminName, companyName, daysLeft, endDate) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.warn('Email transporter oluşturulamadı. Email ayarları kontrol edin.');
      return false;
    }
    const colors = getThemeColors();
    const environmentBadge = getEnvironmentBadge();
    let dayText = '';
    if (daysLeft === 0) dayText = 'Bugün';
    else if (daysLeft === 1) dayText = 'Yarın';
    else dayText = daysLeft + ' gün sonra';
    const subject = isDevelopment
      ? `[DEV] ${companyName} - Premium Abonelik Hatırlatma`
      : `${companyName} - Premium Abonelik Hatırlatma`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: subject,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: ${colors.bgGradient}; padding: 40px 20px; border-radius: 20px;">
          <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              ${environmentBadge}
              <div style="width: 64px; height: 64px; background: ${colors.gradient}; border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
                  <path d="M12 8v4l3 3m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h1 style="color: #1f2937; font-size: 26px; font-weight: bold; margin: 0;">${companyName} - Premium Abonelik Hatırlatma</h1>
              <p style="color: #6b7280; font-size: 16px; margin: 10px 0 0;">Üretim Takip Sistemi</p>
              ${isDevelopment ? '<p style="color: #ef4444; font-size: 12px; font-weight: 600;">DEVELOPMENT ENVIRONMENT</p>' : ''}
            </div>
            <div style="background: #f9fafb; padding: 24px; border-radius: 12px; margin: 24px 0;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                Sayın <strong>${adminName}</strong>,<br><br>
                <b>${companyName}</b> şirketinin premium aboneliğinin bitiş tarihi: <b>${new Date(endDate).toLocaleDateString('tr-TR')}</b><br>
                <span style="color: #b91c1c; font-weight: bold;">${dayText} abonelik süreniz dolacak!</span><br><br>
                Kesintisiz hizmet için lütfen ödeme işlemini tamamlayınız.
              </p>
            </div>
            <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <p style="color: #92400e; font-size: 14px; margin: 0; display: flex; align-items: center;">
                <span style="margin-right: 8px;">⏰</span>
                Abonelik süresi dolduğunda premium özelliklere erişiminiz kısıtlanacaktır.
              </p>
            </div>
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            <div style="text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0;">
                © 2024 Üretim Takip Sistemi. Tüm hakları saklıdır.
              </p>
              ${isDevelopment ? '<p style="color: #ef4444; font-size: 10px; margin: 4px 0 0;">Development Environment - Test Email</p>' : ''}
            </div>
          </div>
        </div>
      `
    };
    await transporter.sendMail(mailOptions);
    console.log(`Abonelik hatırlatma email gönderildi [${process.env.NODE_ENV?.toUpperCase()}]:`, adminEmail);
    return true;
  } catch (error) {
    console.error('Abonelik hatırlatma email gönderme hatası:', error);
    return false;
  }
};

module.exports = {
  sendConfirmEmail,
  sendInviteEmail,
  sendPasswordResetEmail,
  sendPaymentSuccessEmail,
  sendSubscriptionReminderEmail,
  isEmailConfigured
}; 