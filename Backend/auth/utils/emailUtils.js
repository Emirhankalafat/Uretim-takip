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
    const confirmUrl = `${baseUrl}/auth/confirm?token=${confirmToken}`;
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

module.exports = {
  sendConfirmEmail,
  sendInviteEmail,
  isEmailConfigured
}; 