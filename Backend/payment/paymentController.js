const iyzipay = require('../config/iyzico');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PaymentController {
  /**
   * 3D Secure callback handler
   * İyzico sonucu alır, ödeme başarıysa şirketi premium yapar, kartı kaydeder, loglar
   */
  static async handle3DSCallback(req, res) {
    try {
      // Gelen tüm callback verisini logla (debugging için)
      console.log('3DS Callback alındı:', {
        headers: req.headers,
        body: JSON.stringify(req.body, null, 2),
        contentType: req.get('Content-Type')
      });

      const { paymentId, conversationData, conversationId, mdStatus, status } = req.body;
      
      // 1. ÖNCE conversationId kontrolü (her zaman olmalı)
      if (!conversationId) {
        console.warn('❌ conversationId eksik:', JSON.stringify(req.body, null, 2));
        return res.status(400).send('Eksik conversation ID');
      }

      // conversationId formatını kontrol et
      const conversationParts = conversationId.split('-');
      if (conversationParts.length !== 4 || conversationParts[0] !== 'sub') {
        console.warn('❌ Geçersiz conversationId formatı:', conversationId);
        return res.status(400).send('Geçersiz conversation ID');
      }

      // conversationId → sub-USERID-COMPANYID-SAVEFLAG
      const [_, userIdStr, companyIdStr, saveFlag] = conversationParts;
      
      // Sayısal değerleri kontrol et
      if (!userIdStr || !companyIdStr || isNaN(userIdStr) || isNaN(companyIdStr)) {
        console.warn('❌ Geçersiz user/company ID:', { userIdStr, companyIdStr });
        return res.status(400).send('Geçersiz kullanıcı verisi');
      }

      const userId = BigInt(userIdStr);
      const companyId = BigInt(companyIdStr);
      const shouldSaveCard = saveFlag === '1';

      // 2. SONRA mdStatus ve status kontrolü (başarısız ödemeler için)
      // mdStatus: "0" = başarısız, status: "failure" = başarısız
      if ((mdStatus && !['1', '2', '3', '4'].includes(mdStatus)) || status === 'failure') {
        console.warn('❌ 3D Secure/Ödeme başarısız:', {
          mdStatus,
          status,
          conversationId,
          paymentId: paymentId || 'boş'
        });
        
        // Başarısız ödemeyi logla
        try {
          await prisma.paymentLog.create({
            data: {
              user_id: userId,
              status: status || 'md_failed',
              price: 0,
              currency: 'TRY',
              conversation_id: conversationId,
              payment_id: paymentId || 'empty_payment_id',
              basket_id: 'payment_failed',
              error_message: `Ödeme başarısız - mdStatus: ${mdStatus}, status: ${status}`
            }
          });
          console.log('📝 Başarısız ödeme loglandı');
        } catch (logError) {
          console.error('❌ Başarısız ödeme log hatası:', logError);
        }

        console.log('↩️ Başarısızlık sayfasına yönlendiriliyor...');
        return res.redirect(`${process.env.FRONTEND_URL}/payment/fail`);
      }

      // 3. BAŞARILI ÖDEMELER İÇİN diğer veri kontrolü
      if (!paymentId) {
        console.warn('❌ Başarılı ödeme ama paymentId eksik:', {
          paymentId: !!paymentId,
          conversationData: !!conversationData,
          mdStatus,
          status,
          body: JSON.stringify(req.body, null, 2)
        });
        
        // Bu durumda bile logla
        try {
          await prisma.paymentLog.create({
            data: {
              user_id: userId,
              status: 'missing_payment_id',
              price: 0,
              currency: 'TRY',
              conversation_id: conversationId,
              payment_id: paymentId || 'missing_payment_id',
              basket_id: 'incomplete_callback',
              error_message: 'Başarılı görünen ödeme ama paymentId eksik'
            }
          });
        } catch (logError) {
          console.error('❌ Eksik veri log hatası:', logError);
        }

        return res.redirect(`${process.env.FRONTEND_URL}/payment/fail`);
      }

      // conversationData sandbox'ta bazen boş gelebilir, uyarı ver ama devam et
      if (!conversationData) {
        console.warn('⚠️ conversationData boş (sandbox normal olabilir):', {
          paymentId,
          conversationData: conversationData || 'EMPTY',
          mdStatus,
          status,
          environment: process.env.NODE_ENV
        });
      }

      console.log('✅ Callback verisi doğrulandı:', {
        userId: userId.toString(),
        companyId: companyId.toString(),
        shouldSaveCard,
        mdStatus,
        status
      });

      // İyzico ödeme doğrulamaya geç (sadece başarılı ödemeler için)
      const iyzicoRequest = {
        locale: 'tr',
        conversationId,
        paymentId,
        conversationData: conversationData || '' // Boş string olsa bile gönder
      };

      console.log('🔍 İyzico doğrulama request:', {
        conversationId,
        paymentId,
        conversationDataExists: !!conversationData,
        conversationDataLength: conversationData ? conversationData.length : 0
      });

      iyzipay.threedsPayment.create(
        iyzicoRequest,
        async (err, rawResult) => {
          if (err) {
            console.error('❌ İyzico doğrulama hatası:', {
              errorMessage: err.message,
              errorCode: err.errorCode,
              errorGroup: err.errorGroup,
              conversationId,
              paymentId,
              conversationDataProvided: !!conversationData
            });
            
            // Hatalı doğrulama denemesini logla
            try {
              await prisma.paymentLog.create({
                data: {
                  user_id: userId,
                  status: 'verification_error',
                  price: 0,
                  currency: 'TRY',
                  conversation_id: conversationId,
                  payment_id: paymentId,
                  basket_id: 'iyzico_verification_failed',
                  error_message: `İyzico doğrulama hatası: ${err.message} (Code: ${err.errorCode || 'unknown'})`
                }
              });
            } catch (logError) {
              console.error('❌ Hata log kaydı başarısız:', logError);
            }

            return res.redirect(`${process.env.FRONTEND_URL}/payment/fail`);
          }

          let result;
          try {
            // İyzico response'u bazen string, bazen object olarak gelebilir
            if (typeof rawResult === 'string') {
              result = JSON.parse(rawResult);
            } else if (typeof rawResult === 'object' && rawResult !== null) {
              result = rawResult;
            } else {
              throw new Error('Unexpected response type from Iyzico');
            }
          } catch (e) {
            console.error('❌ İyzico JSON parse hatası:', e.message);
            console.error('Raw result:', rawResult);
            
            // Parse hatası logla
            try {
              await prisma.paymentLog.create({
                data: {
                  user_id: userId,
                  status: 'parse_error',
                  price: 0,
                  currency: 'TRY',
                  conversation_id: conversationId,
                  payment_id: paymentId,
                  basket_id: 'json_parse_failed',
                  error_message: `JSON parse hatası: ${e.message}`
                }
              });
            } catch (logError) {
              console.error('❌ Parse hata log kaydı başarısız:', logError);
            }

            return res.redirect(`${process.env.FRONTEND_URL}/payment/fail`);
          }

          // İyzico yanıtını logla
          console.log('📋 İyzico doğrulama yanıtı:', {
            status: result.status,
            errorMessage: result.errorMessage,
            paymentId: result.paymentId,
            price: result.price
          });

          if (result.status !== 'success') {
            console.warn('❌ Ödeme başarısız:', result.errorMessage);
            
            // Başarısız ödemeyi logla
            await prisma.paymentLog.create({
              data: {
                user_id: userId,
                status: result.status,
                price: parseFloat(result.price || '0'),
                currency: result.currency || 'TRY',
                conversation_id: conversationId,
                payment_id: paymentId,
                basket_id: result.basketId || 'unknown',
                error_message: result.errorMessage || 'Ödeme başarısız'
              }
            });

            return res.redirect(`${process.env.FRONTEND_URL}/payment/fail`);
          }

          try {
            console.log('🏆 Ödeme başarılı, veritabanı işlemleri başlatılıyor...');

            // 2. Şirketi premium yap
            await prisma.company.update({
              where: { id: companyId },
              data: {
                Suspscription_package: 'premium',
                Sub_end_time: new Date(new Date().setMonth(new Date().getMonth() + 1))
              }
            });
            console.log('✅ Şirket premium yapıldı:', companyId.toString());

            // 3. Kart kayıt edilecekse
            if (shouldSaveCard && result.cardUserKey && result.cardToken) {
              const card = result.cardDetails || {};
              await prisma.userCard.upsert({
                where: {
                  user_id_card_token: {
                    user_id: userId,
                    card_token: result.cardToken
                  }
                },
                update: {},
                create: {
                  user_id: userId,
                  card_user_key: result.cardUserKey,
                  card_token: result.cardToken,
                  card_alias: card.cardAlias || 'Kayıtlı Kart',
                  bin_number: card.binNumber || '',
                  last_four: card.lastFourDigits || '',
                  card_type: card.cardType || '',
                  association: card.cardAssociation || '',
                  card_family: card.cardFamily || ''
                }
              });
              console.log('💳 Kart kaydedildi:', result.cardToken);
            }

            // 4. Başarılı ödeme kaydı
            await prisma.paymentLog.create({
              data: {
                user_id: userId,
                status: result.status,
                price: parseFloat(result.price || '0'),
                currency: result.currency || 'TRY',
                conversation_id: conversationId,
                payment_id: result.paymentId,
                basket_id: result.basketId || ''
              }
            });
            console.log('📝 Ödeme log kaydı oluşturuldu');

            console.log('🎉 Tüm işlemler başarıyla tamamlandı, başarı sayfasına yönlendiriliyor...');
            return res.redirect(`${process.env.FRONTEND_URL}/payment/success`);
            
          } catch (dbError) {
            console.error('❌ Veritabanı işlem hatası:', dbError);
            
            // Veritabanı hatası logla
            try {
              await prisma.paymentLog.create({
                data: {
                  user_id: userId,
                  status: 'db_error',
                  price: parseFloat(result.price || '0'),
                  currency: result.currency || 'TRY',
                  conversation_id: conversationId,
                  payment_id: result.paymentId,
                  basket_id: result.basketId || 'db_operation_failed',
                  error_message: `Veritabanı hatası: ${dbError.message}`
                }
              });
            } catch (logError) {
              console.error('❌ DB hata log kaydı başarısız:', logError);
            }

            return res.redirect(`${process.env.FRONTEND_URL}/payment/fail`);
          }
        }
      );
    } catch (error) {
      console.error('❌ Callback genel hata:', error);
      console.error('Stack trace:', error.stack);
      return res.redirect(`${process.env.FRONTEND_URL}/payment/fail`);
    }
  }

  /**
   * 3D Secure ödeme başlatma fonksiyonu
   * JWT ile kullanıcıyı doğrular, süper admin kontrolü yapar, İyzico 3D Secure başlatır
   */
  static async start3DSecurePayment(req, res) {
    try {
      const user = req.user;
      
      const {
        cardHolderName,
        cardNumber,
        expireMonth,
        expireYear,
        cvc,
        registerCard, // true / false
        // Billing Address Fields
        billingContactName,
        billingCity,
        billingCountry,
        billingAddress
      } = req.body;

      if (!user.is_SuperAdmin) {
        return res.status(403).json({ error: 'Yetkiniz yok' });
      }

      // Kullanıcının kayıtlı kartı var mı kontrol et
      const cardUserKey = await PaymentController._getCardUserKeyOrNull(user.id);
      const shouldSaveCard = registerCard === true || registerCard === 'true';

      const conversationId = `sub-${user.id}-${user.company_id}-${shouldSaveCard ? '1' : '0'}`;

      const request = {
        locale: 'tr',
        conversationId,
        price: '99.90',
        paidPrice: '99.90',
        currency: 'TRY',
        installment: '1',
        basketId: `premium-${user.id}-${Date.now()}`,
        paymentChannel: 'WEB',
        paymentGroup: 'SUBSCRIPTION',
        callbackUrl: `${process.env.BACKEND_URL}/api/payment/3dsecure/callback`,
        paymentCard: {
          cardHolderName,
          cardNumber,
          expireMonth,
          expireYear,
          cvc,
          registerCard: shouldSaveCard ? '1' : '0'
        },
        buyer: {
          id: user.id.toString(),
          name: user.Name,
          surname: 'Bilinmiyor',
          gsmNumber: '5555555555',
          email: user.Mail,
          identityNumber: '11111111111',
          registrationAddress: 'Kadıköy',
          ip: req.ip,
          city: 'İstanbul',
          country: 'Turkey'
        },
        billingAddress: {
          contactName: billingContactName || user.Name,
          city: billingCity || 'İstanbul',
          country: billingCountry || 'Turkey',
          address: billingAddress || 'Adres belirtilmemiş'
        },
        shippingAddress: {
          contactName: billingContactName || user.Name,
          city: billingCity || 'İstanbul',
          country: billingCountry || 'Turkey',
          address: billingAddress || 'Adres belirtilmemiş'
        },
        basketItems: [
          {
            id: 'PREMIUM',
            name: 'Premium Üyelik',
            category1: 'Abonelik',
            itemType: 'VIRTUAL',
            price: '99.90'
          }
        ]
      };

      // Kayıtlı kart varsa cardUserKey ekle
      if (cardUserKey) {
        request.cardUserKey = cardUserKey;
      }

      iyzipay.threedsInitialize.create(request, (err, result) => {
        if (err) {
          console.error('İyzico 3D başlatma hatası:', err);
          return res.status(500).json({ error: 'Ödeme başlatılamadı' });
        }

        let data;
        try {
          // İyzico response'u bazen string, bazen object olarak gelebilir
          if (typeof result === 'string') {
            data = JSON.parse(result);
          } else if (typeof result === 'object' && result !== null) {
            data = result;
          } else {
            throw new Error('Unexpected response type');
          }
        } catch (e) {
          console.error('İyzico JSON parse hatası:', e.message);
          console.error('Raw result:', result);
          return res.status(500).json({ error: 'Ödeme başlatılamadı' });
        }

        if (data.status !== 'success') {
          return res.status(400).json({ error: data.errorMessage });
        }

        // Debug: İyzico'dan ne geldiğini kontrol et
        console.log('İyzico Response Data:', {
          status: data.status,
          hasThreeDSContent: !!data.threeDSHtmlContent,
          contentLength: data.threeDSHtmlContent?.length,
          contentStart: data.threeDSHtmlContent?.substring(0, 100)
        });

        let htmlContent = data.threeDSHtmlContent;

        // Base64 decode kontrolü - İyzico bazen base64 encode eder
        if (htmlContent && !htmlContent.includes('<html')) {
          try {
            // Base64 olabilir, decode deneyelim
            const decoded = Buffer.from(htmlContent, 'base64').toString('utf-8');
            if (decoded.includes('<html') || decoded.includes('<form')) {
              console.log('Base64 decode başarılı');
              htmlContent = decoded;
            }
          } catch (e) {
            console.log('Base64 decode edilemedi, normal HTML olarak devam ediliyor');
          }
        }

        console.log('Final HTML Content Start:', htmlContent?.substring(0, 200));

        // İyzico'dan gelen HTML içeriğini direkt döndür
        res.send(htmlContent);
      });
    } catch (err) {
      console.error('Ödeme başlatma genel hata:', err);
      res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  /**
   * Helper method - Kullanıcının card user key'ini döndürür
   * @private
   */
  static async _getCardUserKeyOrNull(userId) {
    try {
      const userCard = await prisma.userCard.findFirst({
        where: {
          user_id: BigInt(userId)
        },
        select: {
          card_user_key: true
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      return userCard ? userCard.card_user_key : null;
    } catch (error) {
      console.error('Error fetching user card:', error);
      return null;
    }
  }

  /**
   * Ödeme başlatma fonksiyonu (gelecekte kullanılmak üzere) - DEPRECATED
   * start3DSecurePayment kullanın
   */
  static async initiatePayment(req, res) {
    try {
      // Yönlendirme - start3DSecurePayment kullanılmalı
      res.status(301).json({ 
        message: 'This endpoint is deprecated. Use POST /3dsecure instead',
        redirect: '/api/payment/3dsecure'
      });
    } catch (error) {
      console.error('Payment initiation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Kullanıcının ödeme geçmişini getir
   */
  static async getPaymentHistory(req, res) {
    try {
      const { userId } = req.params;
      
      const payments = await prisma.paymentLog.findMany({
        where: {
          user_id: BigInt(userId)
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      res.json({ success: true, payments });
    } catch (error) {
      console.error('Payment history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Kullanıcının daha önce kayıtlı kartı var mı kontrol eder
   */
  static async getCardUserKeyOrNull(req, res) {
    try {
      const { userId } = req.params;
      
      const cardUserKey = await PaymentController._getCardUserKeyOrNull(userId);
      res.json({ success: true, cardUserKey });
    } catch (error) {
      console.error('Error fetching user card:', error);
      res.status(500).json({ error: 'Kullanıcı kartı sorgulanırken hata oluştu' });
    }
  }

  /**
   * Kullanıcının tüm kayıtlı kartlarını getirir
   */
  static async getUserCards(req, res) {
    try {
      const { userId } = req.params;
      
      const userCards = await prisma.userCard.findMany({
        where: {
          user_id: BigInt(userId)
        },
        select: {
          id: true,
          card_user_key: true,
          card_token: true,
          card_alias: true,
          bin_number: true,
          last_four: true,
          card_type: true,
          association: true,
          card_family: true,
          created_at: true
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      res.json({ success: true, cards: userCards });
    } catch (error) {
      console.error('Error fetching user cards:', error);
      res.status(500).json({ error: 'Kullanıcı kartları sorgulanırken hata oluştu' });
    }
  }

  /**
   * Yeni kart bilgisini kaydeder
   */
  static async saveUserCard(req, res) {
    try {
      const { cardData } = req.body;
      
      const newCard = await prisma.userCard.create({
        data: {
          user_id: BigInt(cardData.user_id),
          card_user_key: cardData.card_user_key,
          card_token: cardData.card_token,
          card_alias: cardData.card_alias,
          bin_number: cardData.bin_number,
          last_four: cardData.last_four,
          card_type: cardData.card_type,
          association: cardData.association,
          card_family: cardData.card_family
        }
      });

      res.json({ success: true, card: newCard });
    } catch (error) {
      console.error('Error saving user card:', error);
      res.status(500).json({ error: 'Kart kaydedilirken hata oluştu' });
    }
  }
}

module.exports = PaymentController; 