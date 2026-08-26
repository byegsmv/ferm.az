"use client";
import { useState, useEffect } from "react";
import { apiFetch, getUser } from "@/lib/apiClient";
import { useRouter } from "@/i18n/routing";
import ProductCard from "@/components/ProductCard";
import Icon from "@/components/ui/Icon";
import { Link } from "@/i18n/routing";
import useSWR from "swr";

const fetcher = (url) => apiFetch(url);

export default function FavoritesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push("/login");
    } else {
      setUser(u);
    }
  }, [router]);

  const { data, error, isLoading } = useSWR(user ? "/api/favorites" : null, fetcher);

  if (!user) return null;

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-24 md:pb-12 pt-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="md:hidden flex items-center justify-center w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-500">
            <Icon name="arrowLeft" size={20} />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Seçilmiş Elanlar</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-gray-400">
            <Icon name="loader" size={24} className="animate-spin" /> Yüklənir...
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">
            Xəta baş verdi: {error.message || "Bilinməyən xəta"}
          </div>
        ) : !data?.favorites || data.favorites.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center flex flex-col items-center justify-center min-h-[50vh] border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mb-4">
              <Icon name="heart" size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Hələlik heç bir elan seçməmisiniz</h2>
            <p className="text-gray-500 max-w-sm mb-6">Bəyəndiyiniz elanları yadda saxlamaq üçün məhsul kartlarındakı ürək ikonuna klikləyin.</p>
            <Link href="/products" className="btn-primary px-8">Kataloqa Bax</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {data.favorites.map((fav) => (
              <ProductCard
                key={fav.id}
                product={{
                  id: fav.product.id,
                  slug: fav.product.slug,
                  title: fav.product.titleAz || fav.product.title,
                  price: fav.product.price,
                  coverImage: Array.isArray(fav.product.images) ? fav.product.images[0]?.url : null,
                  region: fav.product.region,
                  city: fav.product.city,
                  isCorporate: fav.product.isCorporate,
                  tags: fav.product.tags,
                }}
                initialFavorited={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
