const nodemailer = require('nodemailer');
require('dotenv').config();

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

// Confirm email gönder
const sendConfirmEmail = async (userEmail, userName, confirmToken) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.warn('Email transporter oluşturulamadı. Email ayarları kontrol edin.');
      return false;
    }
    
    const confirmUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/confirm?token=${confirmToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Hesap Doğrulama - Üretim Takip Sistemi',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #10b981, #059669); padding: 40px 20px; border-radius: 20px;">
          <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h1 style="color: #1f2937; font-size: 28px; font-weight: bold; margin: 0;">Hoş Geldiniz ${userName}!</h1>
              <p style="color: #6b7280; font-size: 16px; margin: 10px 0 0;">Üretim Takip Sistemi</p>
            </div>
            
            <div style="background: #f9fafb; padding: 24px; border-radius: 12px; margin: 24px 0;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                Hesabınız başarıyla oluşturuldu! Sistemi kullanmaya başlamak için hesabınızı doğrulamanız gerekiyor.
              </p>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${confirmUrl}" 
                 style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 16px 32px; 
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
            
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <div style="text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0;">
                © 2024 Üretim Takip Sistemi. Tüm hakları saklıdır.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Confirm email gönderildi:', userEmail);
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
    
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/accept-invite?token=${inviteToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `${companyName} - Davet`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #10b981, #059669); padding: 40px 20px; border-radius: 20px;">
          <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
                  <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                </svg>
              </div>
              <h1 style="color: #1f2937; font-size: 28px; font-weight: bold; margin: 0;">Davet Aldınız! 🎉</h1>
              <p style="color: #6b7280; font-size: 16px; margin: 10px 0 0;">Üretim Takip Sistemi</p>
            </div>
            
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
                 style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 16px 32px; 
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
            
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <div style="text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0;">
                © 2024 Üretim Takip Sistemi. Tüm hakları saklıdır.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Invite email gönderildi:', userEmail);
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