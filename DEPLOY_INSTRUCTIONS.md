# Vercel Deploy Təlimatları

## 1. Environment Variables Tənzimləməsi

Vercel Dashboard-da aşağıdakı environment variables əlavə edin:

### Vacib:
- `DATABASE_URL`: `postgresql://neondb_owner:npg_DHSxaTPCm47t@ep-little-butterfly-atvzkkl2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- `JWT_ACCESS_SECRET`: `local-dev-access-7f3c9a1e5d8b4c6f2a9e7d1b5c3f8a6e0d4b2f9c7a1e5d8b3c6f0a2e9d7b4c`
- `JWT_REFRESH_SECRET`: `local-dev-refresh-4c8e1a7d3f6b9e2a5c0d8f1b7e4a6c9d2f5b8e1a3c7d0f4b6e9a2c5d8f1b`
- `NODE_ENV`: `production`
- `NEXT_PUBLIC_APP_URL`: `https://fermermarket.vercel.app`

### Əlavə (istəyə görə):
- `RESEND_API_KEY`: Email göndərmə üçün
- `NEXT_PUBLIC_VERCEL_URL`: `https://fermermarket.vercel.app`

## 2. Build Settings

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

## 3. Post-Deploy

Deploy tamamlandıqdan sonra:
1. Vercel Dashboard > Settings > Environment Variables bölməsinə gedin
2. Yuxarıdakı dəyişənləri əlavə edin
3. Layihəni yenidən deploy edin (Redeploy)

## 4. Test

- Ana səhifə: `https://fermermarket.vercel.app`
- Giriş: `https://fermermarket.vercel.app/login`
- Admin: `https://fermermarket.vercel.app/admin`

**Test Hesabı:**
- Email: `admin@fermermarket.az`
- Şifrə: `Admin123!`

</content>
  }
}
```