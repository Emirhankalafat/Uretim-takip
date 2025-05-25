# USER_MANAGEMENT Permission Test Senaryoları

## Güvenlik Kontrolleri

### 1. USER_MANAGEMENT Yetkisi Verme
- ✅ **SuperAdmin**: USER_MANAGEMENT yetkisini herhangi bir kullanıcıya verebilir
- ❌ **Normal USER_MANAGEMENT yetkili kullanıcı**: USER_MANAGEMENT yetkisini başka kullanıcılara veremez
- ❌ **Diğer yetkili kullanıcılar**: USER_MANAGEMENT yetkisini veremez

### 2. USER_MANAGEMENT Yetkisi Çıkarma
- ✅ **SuperAdmin**: USER_MANAGEMENT yetkisini herhangi bir kullanıcıdan çıkarabilir
- ❌ **Normal USER_MANAGEMENT yetkili kullanıcı**: USER_MANAGEMENT yetkisini başka kullanıcılardan çıkaramaz
- ❌ **Diğer yetkili kullanıcılar**: USER_MANAGEMENT yetkisini çıkaramaz

### 3. Diğer Yetkileri Verme/Çıkarma
- ✅ **SuperAdmin**: Tüm yetkileri verebilir/çıkarabilir
- ✅ **USER_MANAGEMENT yetkili kullanıcı**: USER_MANAGEMENT dışındaki yetkileri verebilir/çıkarabilir
- ❌ **Diğer yetkili kullanıcılar**: Yetki veremez/çıkaramaz

## Test API Çağrıları

### USER_MANAGEMENT Yetkisi Verme Testi
```bash
# SuperAdmin ile (başarılı olmalı)
POST /api/permissions/add-permission
{
  "userId": "2",
  "permissionId": "1" // USER_MANAGEMENT permission ID
}

# Normal USER_MANAGEMENT yetkili kullanıcı ile (başarısız olmalı)
POST /api/permissions/add-permission
{
  "userId": "3",
  "permissionId": "1" // USER_MANAGEMENT permission ID
}
# Beklenen Hata: "USER_MANAGEMENT yetkisini sadece SuperAdmin verebilir."
```

### USER_MANAGEMENT Yetkisi Çıkarma Testi
```bash
# SuperAdmin ile (başarılı olmalı)
POST /api/permissions/remove-permission
{
  "userId": "2",
  "permissionId": "1" // USER_MANAGEMENT permission ID
}

# Normal USER_MANAGEMENT yetkili kullanıcı ile (başarısız olmalı)
POST /api/permissions/remove-permission
{
  "userId": "3",
  "permissionId": "1" // USER_MANAGEMENT permission ID
}
# Beklenen Hata: "USER_MANAGEMENT yetkisini sadece SuperAdmin çıkarabilir."
```

### Diğer Yetkileri Verme Testi
```bash
# USER_MANAGEMENT yetkili kullanıcı ile (başarılı olmalı)
POST /api/permissions/add-permission
{
  "userId": "3",
  "permissionId": "2" // Başka bir permission ID (USER_MANAGEMENT değil)
}
```

## Güvenlik Katmanları

1. **Route Seviyesi**: `requirePermission('USER_MANAGEMENT')` - USER_MANAGEMENT yetkisi kontrolü
2. **Controller Seviyesi**: 
   - SuperAdmin kontrolü
   - Aynı şirket kontrolü
   - USER_MANAGEMENT özel kontrolü
3. **Database Seviyesi**: Foreign key constraints ve unique constraints

## Eklenen Yeni Kontroller

### addPermissionToUser fonksiyonunda:
```javascript
// 4. USER_MANAGEMENT yetkisini sadece SuperAdmin verebilir
if (permission.Name === 'USER_MANAGEMENT' && !req.user.is_SuperAdmin) {
  return res.status(403).json({ 
    message: 'USER_MANAGEMENT yetkisini sadece SuperAdmin verebilir.' 
  });
}
```

### removePermissionFromUser fonksiyonunda:
```javascript
// 4. USER_MANAGEMENT yetkisini sadece SuperAdmin çıkarabilir
if (existingPermission.permission.Name === 'USER_MANAGEMENT' && !req.user.is_SuperAdmin) {
  return res.status(403).json({ 
    message: 'USER_MANAGEMENT yetkisini sadece SuperAdmin çıkarabilir.' 
  });
}
``` 