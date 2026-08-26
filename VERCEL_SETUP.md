# Vercel Deploy - Tam Təlimat

## ⚠️ VACİB: Neon DB Quota Problemi Həlli

Neon DB pulsuz planı compute time limitini keçib. **Vercel Postgres** istifadə edin!

---

## 1️⃣ Vercel Postgres Bazası Yaradın

### Addım-addım:

1. **Vercel Dashboard** açın: https://vercel.com/azvebs-projects/fermermarket-main

2. **Storage** bölməsinə gedin (soldakı menyu)

3. **Create Database** düyməsini klikləyin

4. **PostgreSQL** seçin

5. Layihənizi seçin: `fermermarket-main`

6. Database adı: `fermermarket-db`

7. **Create Database** klikləyin

8. Yaranan **DATABASE_URL** environment variable avtomatik layihəyə əlavə olunacaq!

---

## 2️⃣ Environment Variables Yoxlayın

Vercel Dashboard > Settings > Environment Variables:

Aşağıdakılar OLMALIDIR:

```env
DATABASE_URL=postgresql://default:xxx@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_ACCESS_SECRET=local-dev-access-7f3c9a1e5d8b4c6f2a9e7d1b5c3f8a6e0d4b2f9c7a1e5d8b3c6f0a2e9d7b4c
JWT_REFRESH_SECRET=local-dev-refresh-4c8e1a7d3f6b9e2a5c0d8f1b7e4a6c9d2f5b8e1a3c7d0f4b6e9a2c5d8f1b
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://fermermarket.vercel.app
```

---

## 3️⃣ Yenidən Deploy Edin

1. **Deployments** bölməsinə gedin

2. Son deployment-in yanındakı **⋮** (3 nöqtə) klikləyin

3. **Redeploy** seçin

4. **Redeploy** təsdiqləyin

---

## 4️⃣ Test Edin

✅ Ana səhifə: https://fermermarket-main-kzb02sr41-azvebs-projects.vercel.app

✅ Giriş: https://fermermarket-main-kzb02sr41-azvebs-projects.vercel.app/login

**Test Hesabı:**
- Email: `admin@fermermarket.az`
- Şifrə: `Admin123!`

---

## 🔧 Problem Olsa

### Xəta: "Database connection failed"

→ Environment Variables bölməsində `DATABASE_URL` düzgün kopyalanıb?

### Xəta: "Quota exceeded"

→ Vercel Postgres istifadə edin (Neon DB yox!)

### Xəta: "Build failed"

→ Build logs yoxlayın, adətən environment variables eksikdir

---

## 📊 Vercel Postgres Limitlər (PULSUZ)

- ✅ 1GB storage
- ✅ 50MB saatlıq bandwidth
- ✅ Limitsiz compute time
- ✅ Avtomatik backup

---

## 🎯 Nəticə

Vercel Postgres yaradıb environment variables əlavə etdikdən sonra sistem tam işlək olacaq:

✅ Giriş/Çıxış
✅ Elan yerləşdirmə
✅ Push bildirişləri
✅ Admin panel
✅ Bütün CRUD əməliyyatları

</content>
  }
}
```