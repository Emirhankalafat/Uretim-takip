const iyzipay = require('../config/iyzico');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendPaymentSuccessEmail } = require('../auth/utils/emailUtils');

class PaymentController {
  /**
   * Iyzico Checkout Form başlatma - Hosted form sistemi
   * Manuel form yerine Iyzico'nun güvenli formunu kullanır
   */
  static async initializeCheckoutForm(req, res) {
    try {
      const user = req.user; // token'dan gelen kullanıcı
      const { billing, shipping, product, registerCard } = req.body;

      console.log('Checkout Form initialization:', {
        userId: user.id,
        userEmail: user.email,
        productPrice: product?.price,
        hasBilling: !!billing,
        hasShipping: !!shipping,
        registerCard
      });

      // Validation
      if (!product || !product.price) {
        return res.status(400).json({ error: 'Ürün bilgisi eksik' });
      }

      if (!billing || !billing.address || !billing.city) {
        return res.status(400).json({ error: 'Fatura adresi bilgileri eksik' });
      }

      const request = {
        locale: 'tr',
        conversationId: `checkout-${user.id}-${Date.now()}`,
        price: product.price,
        paidPrice: product.price,
        currency: 'TRY',
        basketId: product.basketId || `basket-${user.id}-${Date.now()}`,
        paymentGroup: 'PRODUCT',
        callbackUrl: `${process.env.BACKEND_URL}/api/payment/callback`,
        enabledInstallments: [1], // taksit sayıları
        buyer: {
          id: `buyer-${user.id}-${Date.now()}`,
          name: user.Name || user.name,
          surname: user.surname || 'Bilinmiyor',
          email: user.Mail || user.email,
          gsmNumber: user.phone || '+901234567890',
          identityNumber: user.identityNumber || '11111111111',
          registrationAddress: billing.address,
          ip: req.ip || req.connection.remoteAddress || '127.0.0.1',
          city: billing.city,
          country: billing.country || 'Turkey',
          zipCode: billing.zipCode || '34000'
        },
        shippingAddress: {
          contactName: shipping?.contactName || `${user.Name || user.name} ${user.surname || ''}`,
          city: shipping?.city || billing.city,
          country: shipping?.country || billing.country || 'Turkey',
          address: shipping?.address || billing.address,
          zipCode: shipping?.zipCode || billing.zipCode || '34000'
        },
        billingAddress: {
          contactName: billing.contactName || `${user.Name || user.name} ${user.surname || ''}`,
          city: billing.city,
          country: billing.country || 'Turkey',
          address: billing.address,
          zipCode: billing.zipCode || '34000'
        },
        basketItems: [
          {
            id: product.id || 'premium-membership',
            name: product.name || 'Premium Üyelik',
            category1: product.category || 'Membership',
            itemType: 'VIRTUAL',
            price: product.price
          }
        ]
      };

      // Kart kaydetme seçeneği
      console.log('🔍 RegisterCard debug:', { registerCard, type: typeof registerCard });
      
      if (registerCard === true) {
        request.registerCard = '1'; // String olarak deneyelim
      }

      console.log('Iyzico Checkout Request:', {
        conversationId: request.conversationId,
        price: request.price,
        currency: request.currency,
        callbackUrl: request.callbackUrl,
        buyerId: request.buyer.id,
        buyerEmail: request.buyer.email,
        registerCard: request.registerCard // Bu alanı da loglayalım
      });

      // Tam request objesini de loglayalım
      console.log('🔍 Full Iyzico Request:', JSON.stringify(request, null, 2));

      iyzipay.checkoutFormInitialize.create(request, async (err, result) => {
        if (err) {
          console.error('❌ Iyzico Checkout Form error:', {
            errorMessage: err.message,
            errorCode: err.errorCode,
            errorGroup: err.errorGroup
          });
          return res.status(500).json({ 
            error: 'Ödeme formu başlatılamadı', 
            detail: err.message 
          });
        }

        if (result.status !== 'success') {
          console.error('❌ Iyzico Checkout Form failed:', {
            status: result.status,
            errorCode: result.errorCode,
            errorMessage: result.errorMessage
          });
          return res.status(500).json({ 
            error: 'Ödeme formu başlatılamadı', 
            detail: result.errorMessage || 'Unknown error'
          });
        }

        // Token'ı Redis'e kullanıcı bilgileriyle birlikte kaydet (30 dakika expire)
        try {
          const { redisClient } = require('../config/redis');
          const checkoutData = {
            userId: user.id,
            conversationId: request.conversationId,
            price: product.price,
            productName: product.name || 'Premium Üyelik',
            createdAt: new Date().toISOString()
          };
          
          await redisClient.setEx(`checkout_token:${result.token}`, 1800, JSON.stringify(checkoutData));
          console.log('✅ Checkout token Redis\'e kaydedildi:', result.token?.substring(0, 20) + '...');
        } catch (redisError) {
          console.error('❌ Redis\'e checkout token kaydedilemedi:', redisError);
          // Redis hatası olursa da devam et, callback'te alternatif yöntem kullanılacak
        }

        console.log('✅ Checkout Form created successfully:', {
          token: result.token?.substring(0, 20) + '...',
          checkoutFormUrl: result.checkoutFormUrl,
          paymentPageUrl: result.paymentPageUrl
        });

        // Başarılı response - frontend'e checkout form bilgilerini döndür
        res.json({
          success: true,
          token: result.token,
          checkoutFormUrl: result.checkoutFormUrl,
          paymentPageUrl: result.paymentPageUrl,
          checkoutFormContent: result.checkoutFormContent // HTML content da olabilir
        });
      });

    } catch (error) {
      console.error('Checkout Form genel hata:', error);
      res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  /**
   * Iyzico Checkout Form callback handler
   * Checkout Form'dan gelen sonuçları işler
   */
  static async handleCheckoutCallback(req, res) {
    try {
      console.log('Checkout Form Callback alındı:', {
        headers: req.headers,
        body: req.body,
        query: req.query
      });

      const { token } = req.body;

      if (!token) {
        console.error('❌ Checkout callback token eksik');
        return res.redirect(`${process.env.FRONTEND_URL}/payment/fail`);
      }

      // Iyzico'dan ödeme sonucunu al
      const request = {
        locale: 'tr',
        token: token
      };

      iyzipay.checkoutForm.retrieve(request, async (err, result) => {
        if (err) {
          console.error('❌ Checkout Form retrieve error:', err);
          return res.redirect(`${process.env.FRONTEND_URL}/payment/fail`);
        }

        if (result.status !== 'success') {
          console.error('❌ Checkout Form payment failed:', {
            status: result.status,
            errorCode: result.errorCode,
            errorMessage: result.errorMessage
          });
          // errorMessage varsa query string ile yönlendir
          const errorMsg = encodeURIComponent(result.errorMessage || '')

          // Başarısız ödeme logu ekle
          try {
            // Kullanıcı ve conversationId'yi Redis veya conversationId'den çöz
            let userId = null;
            let conversationId = null;
            try {
              const { redisClient } = require('../config/redis');
              const checkoutDataJson = await redisClient.get(`checkout_token:${token}`);
              if (checkoutDataJson) {
                const checkoutData = JSON.parse(checkoutDataJson);
                userId = BigInt(checkoutData.userId);
                conversationId = checkoutData.conversationId;
              } else if (result.conversationId) {
                conversationId = result.conversationId;
                const conversationParts = result.conversationId.split('-');
                if (conversationParts.length >= 3 && conversationParts[0] === 'checkout') {
                  userId = BigInt(conversationParts[1]);
                }
              }
            } catch (e) {
              // ignore
            }
            if (userId && conversationId) {
              await prisma.paymentLog.create({
                data: {
                  user_id: userId,
                  status: 'fail',
                  price: parseFloat(result.paidPrice || 0),
                  currency: result.currency || 'TRY',
                  conversation_id: conversationId,
                  payment_id: result.paymentId || '-',
                  basket_id: result.basketId || '-',
                  error_message: `${result.errorCode || ''} ${result.errorMessage || ''}`.trim()
                }
              });
            }
          } catch (logErr) {
            console.error('❌ Failed to log payment fail:', logErr);
          }

          return res.redirect(`${process.env.FRONTEND_URL}/payment/fail${errorMsg ? `?errorMessage=${errorMsg}` : ''}`);
        }

        console.log('✅ Checkout Form payment successful:', {
          paymentId: result.paymentId,
          conversationId: result.conversationId,
          price: result.paidPrice,
          status: result.paymentStatus
        });

        // Kart bilgilerini debug için logla
        console.log('🔍 Kart bilgileri debug:', {
          cardUserKey: result.cardUserKey,
          binNumber: result.binNumber,
          cardToken: result.cardToken,
          cardAlias: result.cardAlias,
          lastFourDigits: result.lastFourDigits,
          cardType: result.cardType,
          cardAssociation: result.cardAssociation,
          cardFamily: result.cardFamily,
          hasCardUserKey: !!result.cardUserKey,
          hasBinNumber: !!result.binNumber
        });

        let userId;
        let conversationId;

        // Önce Redis'ten kullanıcı bilgilerini al
        try {
          const { redisClient } = require('../config/redis');
          const checkoutDataJson = await redisClient.get(`checkout_token:${token}`);
          
          if (checkoutDataJson) {
            const checkoutData = JSON.parse(checkoutDataJson);
            userId = BigInt(checkoutData.userId);
            conversationId = checkoutData.conversationId;
            console.log("✅ Redis'ten kullanıcı bilgisi alındı:", { userId: checkoutData.userId, conversationId });
            
            // Kullanıldıktan sonra token'ı sil
            await redisClient.del(`checkout_token:${token}`);
          } else {
            console.warn("⚠️ Redis'te token bulunamadı, conversationId'den çözmeye çalışılıyor...");
            
            // Redis'te yoksa conversationId'den çözmeye çalış (fallback)
            if (result.conversationId) {
              conversationId = result.conversationId;
              const conversationParts = result.conversationId.split('-');
              if (conversationParts.length >= 3 && conversationParts[0] === 'checkout') {
                userId = BigInt(conversationParts[1]);
                console.log("✅ ConversationId'den kullanıcı bilgisi çözüldü:", { userId: conversationParts[1], conversationId });
              } else {
                throw new Error('Invalid conversationId format');
              }
            } else {
              throw new Error("Ne Redis'te token ne de conversationId bulunamadı");
            }
          }
        } catch (redisError) {
          console.error('❌ Kullanıcı bilgisi alınamadı:', redisError);
          return res.redirect(`${process.env.FRONTEND_URL}/payment/fail`);
        }

        if (!userId) {
          console.error('❌ UserId belirlenemedi');
          return res.redirect(`${process.env.FRONTEND_URL}/payment/fail`);
        }

        try {
          // Kullanıcının şirketini premium yap
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { company_id: true, Mail: true, Name: true }
          });

          if (!user) {
            throw new Error('Kullanıcı bulunamadı');
          }

          // Şirketin mevcut abonelik durumunu kontrol et
          const company = await prisma.company.findUnique({
            where: { id: user.company_id },
            select: { 
              Suspscription_package: true, 
              Sub_end_time: true,
              Name: true
            }
          });

          let newEndDate;
          let isRenewal = false;
          const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000; // 30 gün

          if (company?.Suspscription_package === 'premium' && company?.Sub_end_time) {
            // Premium varsa ve henüz süresi dolmamışsa, mevcut süreye 30 gün ekle
            const currentEndDate = new Date(company.Sub_end_time);
            const now = new Date();
            
            if (currentEndDate > now) {
              // Mevcut süre henüz dolmamış, ona 30 gün ekle
              newEndDate = new Date(currentEndDate.getTime() + thirtyDaysInMs);
              console.log('✅ Mevcut premium süresine 30 gün eklendi:', {
                eskiSure: currentEndDate.toISOString(),
                yeniSure: newEndDate.toISOString()
              });
              isRenewal = true;
            } else {
              // Süresi dolmuş, bugünden 30 gün
              newEndDate = new Date(Date.now() + thirtyDaysInMs);
              console.log('✅ Süresi dolmuş premium yenilendi:', {
                yeniSure: newEndDate.toISOString()
              });
              isRenewal = false;
            }
          } else {
            // İlk kez premium olan veya trial/basic olan, bugünden 30 gün
            newEndDate = new Date(Date.now() + thirtyDaysInMs);
            console.log('✅ Yeni premium üyelik başlatıldı:', {
              yeniSure: newEndDate.toISOString()
            });
            isRenewal = false;
          }

          await prisma.company.update({
            where: { id: user.company_id },
            data: {
              Suspscription_package: 'premium',
              Sub_end_time: newEndDate
            }
          });

          // Ödeme log'u kaydet
          await prisma.paymentLog.create({
            data: {
              user_id: userId,
              status: 'success',
              price: parseFloat(result.paidPrice),
              currency: result.currency,
              conversation_id: conversationId || result.conversationId || 'unknown',
              payment_id: result.paymentId,
              basket_id: result.basketId || 'checkout-form',
              error_message: null
            }
          });

          // Eğer kart kaydedilmişse kaydet (sadece cardUserKey varsa)
          console.log('🔍 Kart kaydetme kontrol:', {
            cardUserKey: !!result.cardUserKey,
            binNumber: !!result.binNumber,
            lastFourDigits: !!result.lastFourDigits,
            cardType: !!result.cardType
          });

          let cardInfo = null;
          // Sadece cardUserKey varsa kaydet (abonelik yenilemesi için gerekli)
          if (result.cardUserKey && result.binNumber) {
            try {
              await prisma.userCard.create({
                data: {
                  user_id: userId,
                  card_user_key: result.cardUserKey,
                  card_token: result.cardToken || '',
                  card_alias: result.cardAlias || `**** ${result.lastFourDigits}`,
                  bin_number: result.binNumber,
                  last_four: result.lastFourDigits,
                  card_type: result.cardType || 'unknown',
                  association: result.cardAssociation || 'unknown',
                  card_family: result.cardFamily || 'unknown'
                }
              });
              console.log('💳 Kart bilgileri kaydedildi (cardUserKey ile)');
              cardInfo = {
                lastFour: result.lastFourDigits,
                cardType: result.cardType || 'unknown',
                cardAlias: result.cardAlias || `**** ${result.lastFourDigits}`
              };
            } catch (cardSaveError) {
              console.error('❌ Kart kaydetme hatası:', cardSaveError);
              // Kart kaydetme hatası olursa devam et, ödeme zaten başarılı
            }
          } else {
            console.log('⚠️ cardUserKey yok, kart kaydetme atlandı (abonelik yenilemesi için gereksiz)');
            // Kart kaydedilmediyse de mailde kart bilgisi gösterilmesin
            cardInfo = null;
          }

          // Ödeme başarılı mail gönder
          try {
            await sendPaymentSuccessEmail(
              user.Mail,
              user.Name || '',
              result.paidPrice,
              newEndDate,
              cardInfo,
              isRenewal,
              company.Name || ''
            );
          } catch (mailErr) {
            console.error('Ödeme başarılı mail gönderilemedi:', mailErr);
          }

          console.log('🎉 Premium üyelik başarıyla aktifleştirildi');
          return res.redirect(`${process.env.FRONTEND_URL}/payment/success`);

        } catch (dbError) {
          console.error('❌ Database update error:', dbError);
          
          // En azından log kaydet
          try {
            await prisma.paymentLog.create({
              data: {
                user_id: userId,
                status: 'payment_success_db_error',
                price: parseFloat(result.paidPrice),
                currency: result.currency,
                conversation_id: conversationId || result.conversationId || 'unknown',
                payment_id: result.paymentId,
                basket_id: result.basketId || 'checkout-form',
                error_message: `DB error: ${dbError.message}`
              }
            });
          } catch (logError) {
            console.error('❌ Failed to log DB error:', logError);
          }
          
          return res.redirect(`${process.env.FRONTEND_URL}/payment/fail`);
        }
      });

    } catch (error) {
      console.error('Checkout callback genel hata:', error);
      res.redirect(`${process.env.FRONTEND_URL}/payment/fail`);
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

      // BigInt değerleri string'e çevir
      const serializedPayments = payments.map(payment => ({
        ...payment,
        id: payment.id.toString(),
        user_id: payment.user_id.toString()
      }));

      res.json({ success: true, payments: serializedPayments });
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

      // BigInt değerleri string'e çevir
      const serializedCards = userCards.map(card => ({
        ...card,
        id: card.id.toString() // BigInt'i string'e çevir
      }));

      res.json({ success: true, cards: serializedCards });
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

      // BigInt değerleri string'e çevir
      const serializedCard = {
        ...newCard,
        id: newCard.id.toString(),
        user_id: newCard.user_id.toString()
      };

      res.json({ success: true, card: serializedCard });
    } catch (error) {
      console.error('Error saving user card:', error);
      res.status(500).json({ error: 'Kart kaydedilirken hata oluştu' });
    }
  }

  /**
   * Admin için tüm ödemeleri getirir (filtreli ve şirket adı ile)
   */
  static async getAllPayments(req, res) {
    try {
      const { status, user_id, company_id, startDate, endDate, minPrice, maxPrice, search } = req.query;
      let whereClause = {};
      if (status) whereClause.status = status;
      if (user_id) whereClause.user_id = BigInt(user_id);
      if (startDate || endDate) {
        whereClause.created_at = {};
        if (startDate) whereClause.created_at.gte = new Date(startDate);
        if (endDate) whereClause.created_at.lte = new Date(endDate);
      }
      if (minPrice) {
        whereClause.price = { ...(whereClause.price || {}), gte: parseFloat(minPrice) };
      }
      if (maxPrice) {
        whereClause.price = { ...(whereClause.price || {}), lte: parseFloat(maxPrice) };
      }
      if (search) {
        whereClause.OR = [
          { payment_id: { contains: search, mode: 'insensitive' } },
          { basket_id: { contains: search, mode: 'insensitive' } },
          { error_message: { contains: search, mode: 'insensitive' } }
        ];
      }
      // company_id ile filtreleme için user üzerinden ilişki kur
      let include = {
        user: {
          select: {
            id: true,
            Name: true,
            Mail: true,
            company: { select: { id: true, Name: true } }
          }
        }
      };
      if (company_id) {
        whereClause.user = { company_id: BigInt(company_id) };
      }
      const payments = await prisma.paymentLog.findMany({
        where: whereClause,
        include,
        orderBy: { created_at: 'desc' }
      });
      // BigInt değerleri string'e çevir ve company adı ekle
      const serializedPayments = payments.map(payment => ({
        ...payment,
        id: payment.id.toString(),
        user_id: payment.user_id.toString(),
        user: payment.user ? {
          ...payment.user,
          id: payment.user.id.toString(),
          company: payment.user.company ? {
            ...payment.user.company,
            id: payment.user.company.id.toString()
          } : null
        } : null,
        company_name: payment.user?.company?.Name || '-',
        company_id: payment.user?.company?.id?.toString() || null
      }));
      res.json({ success: true, payments: serializedPayments });
    } catch (error) {
      console.error('getAllPayments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = PaymentController; 