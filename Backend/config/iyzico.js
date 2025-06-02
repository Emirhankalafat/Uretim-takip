const Iyzipay = require('iyzipay');

const iyzipayConfig = {
    apiKey: process.env.IYZICO_API_KEY,
    secretKey: process.env.IYZICO_API_SECRET,
    uri: process.env.IYZICO_URI || 'https://sandbox-api.iyzipay.com',
    currency: 'TRY',
    locale: 'tr'
};

// İyzipay konfigürasyonunu doğrula
const validateIyzipayConfig = () => {
    if (!iyzipayConfig.apiKey) {
        throw new Error('IYZICO_API_KEY environment variable is required');
    }
    if (!iyzipayConfig.secretKey) {
        throw new Error('IYZICO_API_SECRET environment variable is required');
    }
    console.log('İyzipay configuration validated successfully');
};

// İyzipay instance'ını oluştur
const iyzipay = new Iyzipay(iyzipayConfig);

// Konfigürasyonu validate et
validateIyzipayConfig();

module.exports = iyzipay;
