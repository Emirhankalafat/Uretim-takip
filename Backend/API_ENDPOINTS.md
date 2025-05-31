# Kategori ve Ürün API Endpoint'leri

## Gerekli Permission'lar

### Kategori Permission'ları
- `CATEGORY_CREATE` - Kategori oluşturma
- `CATEGORY_READ` - Kategori görüntüleme
- `CATEGORY_UPDATE` - Kategori güncelleme
- `CATEGORY_DELETE` - Kategori silme

### Ürün Permission'ları
- `PRODUCT_CREATE` - Ürün oluşturma
- `PRODUCT_READ` - Ürün görüntüleme
- `PRODUCT_UPDATE` - Ürün güncelleme
- `PRODUCT_DELETE` - Ürün silme

### Ürün Adımları Permission'ları
- `PRODUCT_STEP_CREATE` - Ürün adımı oluşturma
- `PRODUCT_STEP_READ` - Ürün adımı görüntüleme
- `PRODUCT_STEP_UPDATE` - Ürün adımı güncelleme
- `PRODUCT_STEP_DELETE` - Ürün adımı silme

## Kategori Endpoint'leri

### 1. Kategorileri Listeleme
```
GET /api/categories
Authorization: Bearer token gerekli
Permission: CATEGORY_READ
```

**Response:**
```json
{
  "message": "Kategoriler başarıyla getirildi.",
  "categories": [
    {
      "id": "1",
      "Name": "Elektronik",
      "Description": "Elektronik ürünler",
      "Company_id": "1",
      "productCount": 5
    }
  ]
}
```

### 2. Tek Kategori Getirme
```
GET /api/categories/:id
Authorization: Bearer token gerekli
Permission: CATEGORY_READ
```

**Response:**
```json
{
  "message": "Kategori başarıyla getirildi.",
  "category": {
    "id": "1",
    "Name": "Elektronik",
    "Description": "Elektronik ürünler",
    "Company_id": "1",
    "products": [
      {
        "id": "1",
        "name": "Laptop",
        "description": "Gaming laptop"
      }
    ]
  }
}
```

### 3. Kategori Oluşturma
```
POST /api/categories
Authorization: Bearer token gerekli
Permission: CATEGORY_CREATE
```

**Request Body:**
```json
{
  "Name": "Elektronik",
  "Description": "Elektronik ürünler" // Opsiyonel
}
```

**Response:**
```json
{
  "message": "Kategori başarıyla oluşturuldu.",
  "category": {
    "id": "1",
    "Name": "Elektronik",
    "Description": "Elektronik ürünler",
    "Company_id": "1"
  }
}
```

### 4. Kategori Güncelleme
```
PUT /api/categories/:id
Authorization: Bearer token gerekli
Permission: CATEGORY_UPDATE
```

**Request Body:**
```json
{
  "Name": "Elektronik Ürünler",
  "Description": "Güncellenmiş açıklama"
}
```

### 5. Kategori Silme
```
DELETE /api/categories/:id
Authorization: Bearer token gerekli
Permission: CATEGORY_DELETE
```

**Response:**
```json
{
  "message": "Kategori başarıyla silindi."
}
```

## Ürün Endpoint'leri

### 1. Ürünleri Listeleme
```
GET /api/products
Authorization: Bearer token gerekli
Permission: PRODUCT_READ

Query Parameters:
- category_id: Kategoriye göre filtreleme
- search: Ürün adı veya açıklamasında arama
```

**Örnek:**
```
GET /api/products?category_id=1&search=laptop
```

**Response:**
```json
{
  "message": "Ürünler başarıyla getirildi.",
  "products": [
    {
      "id": "1",
      "name": "Gaming Laptop",
      "description": "Yüksek performanslı laptop",
      "Category_id": "1",
      "Company_id": "1",
      "category": {
        "id": "1",
        "Name": "Elektronik"
      }
    }
  ]
}
```

### 2. Tek Ürün Getirme
```
GET /api/products/:id
Authorization: Bearer token gerekli
Permission: PRODUCT_READ
```

### 3. Kategoriye Göre Ürünleri Getirme
```
GET /api/products/category/:categoryId
Authorization: Bearer token gerekli
Permission: PRODUCT_READ
```

**Response:**
```json
{
  "message": "Kategoriye ait ürünler başarıyla getirildi.",
  "products": [...],
  "category": {
    "id": "1",
    "Name": "Elektronik",
    "Company_id": "1"
  }
}
```

### 4. Ürün Oluşturma
```
POST /api/products
Authorization: Bearer token gerekli
Permission: PRODUCT_CREATE
```

**Request Body:**
```json
{
  "name": "Gaming Laptop",
  "description": "Yüksek performanslı laptop", // Opsiyonel
  "Category_id": "1" // Zorunlu
}
```

**Response:**
```json
{
  "message": "Ürün başarıyla oluşturuldu.",
  "product": {
    "id": "1",
    "name": "Gaming Laptop",
    "description": "Yüksek performanslı laptop",
    "Category_id": "1",
    "Company_id": "1",
    "category": {
      "id": "1",
      "Name": "Elektronik"
    }
  }
}
```

### 5. Ürün Güncelleme
```
PUT /api/products/:id
Authorization: Bearer token gerekli
Permission: PRODUCT_UPDATE
```

**Request Body:**
```json
{
  "name": "Güncellenmiş Laptop",
  "description": "Yeni açıklama",
  "Category_id": "2"
}
```

### 6. Ürün Silme
```
DELETE /api/products/:id
Authorization: Bearer token gerekli
Permission: PRODUCT_DELETE
```

## Ürün Adımları (Product Steps) Endpoint'leri

### 1. Ürün Adımlarını Listeleme
```
GET /api/product-steps
Authorization: Bearer token gerekli
Permission: PRODUCT_STEP_READ

Query Parameters:
- product_id: Belirli ürünün adımlarını filtreleme
- search: Adım adı veya açıklamasında arama
```

**Örnek:**
```
GET /api/product-steps?product_id=1&search=hazırlık
```

**Response:**
```json
{
  "message": "Ürün adımları başarıyla getirildi.",
  "productSteps": [
    {
      "id": "1",
      "Name": "Malzeme Hazırlığı",
      "Description": "Gerekli malzemelerin hazırlanması",
      "Product_id": "1",
      "Step_number": 1,
      "Responsible_User": "2",
      "created_at": "2025-05-27T00:00:00.000Z",
      "updated_at": "2025-05-27T00:00:00.000Z",
      "product": {
        "id": "1",
        "name": "Gaming Laptop"
      },
      "responsible": {
        "id": "2",
        "Name": "Ahmet Yılmaz",
        "Mail": "ahmet@example.com"
      }
    }
  ]
}
```

### 2. Belirli Ürünün Adımlarını Getirme
```
GET /api/product-steps/product/:productId
Authorization: Bearer token gerekli
Permission: PRODUCT_STEP_READ
```

**Response:**
```json
{
  "message": "Ürün adımları başarıyla getirildi.",
  "product": {
    "id": "1",
    "name": "Gaming Laptop",
    "description": "Yüksek performanslı laptop",
    "Category_id": "1",
    "Company_id": "1"
  },
  "productSteps": [
    {
      "id": "1",
      "Name": "Malzeme Hazırlığı",
      "Description": "Gerekli malzemelerin hazırlanması",
      "Product_id": "1",
      "Step_number": 1,
      "Responsible_User": "2",
      "created_at": "2025-05-27T00:00:00.000Z",
      "updated_at": "2025-05-27T00:00:00.000Z",
      "responsible": {
        "id": "2",
        "Name": "Ahmet Yılmaz",
        "Mail": "ahmet@example.com"
      }
    }
  ]
}
```

### 3. Tek Adım Getirme
```
GET /api/product-steps/:id
Authorization: Bearer token gerekli
Permission: PRODUCT_STEP_READ
```

**Response:**
```json
{
  "message": "Ürün adımı başarıyla getirildi.",
  "productStep": {
    "id": "1",
    "Name": "Malzeme Hazırlığı",
    "Description": "Gerekli malzemelerin hazırlanması",
    "Product_id": "1",
    "Step_number": 1,
    "Responsible_User": "2",
    "created_at": "2025-05-27T00:00:00.000Z",
    "updated_at": "2025-05-27T00:00:00.000Z",
    "product": {
      "id": "1",
      "name": "Gaming Laptop",
      "Company_id": "1"
    },
    "responsible": {
      "id": "2",
      "Name": "Ahmet Yılmaz",
      "Mail": "ahmet@example.com"
    }
  }
}
```

### 4. Ürün Adımı Oluşturma
```
POST /api/product-steps
Authorization: Bearer token gerekli
Permission: PRODUCT_STEP_CREATE
```

**Request Body:**
```json
{
  "Name": "Malzeme Hazırlığı",
  "Description": "Gerekli malzemelerin hazırlanması", // Opsiyonel
  "Product_id": "1", // Zorunlu
  "Step_number": 1, // Zorunlu
  "Responsible_User": "2" // Opsiyonel
}
```

**Response:**
```json
{
  "message": "Ürün adımı başarıyla oluşturuldu.",
  "productStep": {
    "id": "1",
    "Name": "Malzeme Hazırlığı",
    "Description": "Gerekli malzemelerin hazırlanması",
    "Product_id": "1",
    "Step_number": 1,
    "Responsible_User": "2",
    "created_at": "2025-05-27T00:00:00.000Z",
    "updated_at": "2025-05-27T00:00:00.000Z",
    "product": {
      "id": "1",
      "name": "Gaming Laptop"
    },
    "responsible": {
      "id": "2",
      "Name": "Ahmet Yılmaz",
      "Mail": "ahmet@example.com"
    }
  }
}
```

### 5. Ürün Adımı Güncelleme
```PUT /api/product-steps/:id
Authorization: Bearer token gerekli
Permission: PRODUCT_STEP_UPDATE
```

**Request Body:**
```json
{
  "Name": "Güncellenmiş Malzeme Hazırlığı",
  "Description": "Yeni açıklama",
  "Step_number": 2,
  "Responsible_User": "3"
}
```

### 6. Ürün Adımı Silme
```
DELETE /api/product-steps/:id
Authorization: Bearer token gerekli
Permission: PRODUCT_STEP_DELETE
```

**Response:**
```json
{
  "message": "Ürün adımı başarıyla silindi."
}
```

### 7. Adım Sırasını Güncelleme (Bulk Update)
```
PUT /api/product-steps/product/:productId/reorder
Authorization: Bearer token gerekli
Permission: PRODUCT_STEP_UPDATE
```

**Request Body:**
```json
{
  "steps": [
    {
      "id": "1",
      "step_number": 2
    },
    {
      "id": "2", 
      "step_number": 1
    },
    {
      "id": "3",
      "step_number": 3
    }
  ]
}
```

**Response:**
```json
{
  "message": "Adım sıralaması başarıyla güncellendi."
}
```

## Hata Kodları

- `400` - Bad Request (Eksik veya geçersiz veri)
- `401` - Unauthorized (Kimlik doğrulama gerekli)
- `403` - Forbidden (Yetki yok)
- `404` - Not Found (Kaynak bulunamadı)
- `500` - Internal Server Error (Sunucu hatası)

## Önemli Notlar

1. **Şirket İzolasyonu**: Kullanıcılar sadece kendi şirketlerinin kategorilerini ve ürünlerini görebilir/düzenleyebilir.

2. **Kategori Silme**: Kategoriye bağlı ürünler varsa kategori silinemez.

3. **Ürün-Kategori İlişkisi**: Ürün oluştururken kategori aynı şirkette olmalıdır.

4. **İsim Benzersizliği**: Aynı şirkette aynı isimde kategori/ürün oluşturulamaz.

5. **SuperAdmin**: SuperAdmin kullanıcıları tüm permission'lara sahiptir.

## Test Etmek İçin

1. Önce bir kullanıcıya gerekli permission'ları verin
2. Authentication token'ı alın
3. Endpoint'leri test edin

**Permission Verme Örneği:**
```json
POST /api/permissions/assign
{
  "userId": "1",
  "permissionIds": ["5", "6", "7", "8", "9", "10", "11", "12"]
}
``` 
