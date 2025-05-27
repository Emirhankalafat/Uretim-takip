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