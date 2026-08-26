import { Link } from "@/i18n/routing";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-gradient-to-br from-green-50 to-white">
      <div className="mb-6 text-8xl animate-bounce"></div>
      <h1 className="text-6xl font-black text-brand-600 mb-2">404</h1>
      <p className="text-2xl font-bold text-gray-800 mb-2">Səhifə tapılmadı</p>
      <p className="text-gray-500 mb-8 max-w-xs">
        Axtardığınız səhifə mövcud deyil və ya köçürülüb.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link href="/" className="btn-primary"> Ana səhifə</Link>
        <Link href="/products" className="btn-secondary">Məhsullara bax</Link>
      </div>
    </main>
  );
}
