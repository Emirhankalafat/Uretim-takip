#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config();

// Test için basit MCP tool çağırma simülasyonu
async function testMCPTools() {
  console.log("🧪 MCP Tool'ları test ediliyor...\n");
  
  // Mevcut tool'ları içe aktar
  const orderList = (await import('./tools/order_list.js')).default;
  const customersList = (await import('./tools/customers_list.js')).default;
  const categoriesList = (await import('./tools/categories_list.js')).default;
  const productsList = (await import('./tools/products_list.js')).default;
  const companyInfo = (await import('./tools/company_info.js')).default;
  
  const tools = [
    { name: "Sipariş Listesi", tool: orderList },
    { name: "Müşteri Listesi", tool: customersList },
    { name: "Kategori Listesi", tool: categoriesList },
    { name: "Ürün Listesi", tool: productsList },
    { name: "Şirket Bilgileri", tool: companyInfo }
  ];
  
  for (const { name, tool } of tools) {
    try {
      console.log(`📋 ${name} test ediliyor...`);
      const result = await tool.handler({}, { env: process.env });
      
      if (result.error) {
        console.log(`❌ ${name} - Hata:`, result.error.message);
      } else {
        console.log(`✅ ${name} - Başarılı!`);
        // JSON çıktısını kısaltılmış şekilde göster
        const content = result.content[0].text;
        const jsonMatch = content.match(/```json\n(.*?)\n```/s);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[1]);
          console.log(`   Veri sayısı: ${Object.keys(data)[0] ? Object.keys(data).length : 'N/A'}`);
        }
      }
    } catch (error) {
      console.log(`❌ ${name} - Exception:`, error.message);
    }
    console.log("");
  }
}

testMCPTools().catch(console.error);
