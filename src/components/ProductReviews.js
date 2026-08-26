"use client";
import Icon from "@/components/ui/Icon";
import { useEffect, useState } from "react";
import { apiFetch, getUser } from "@/lib/apiClient";

function Stars({ value, onChange, size = "text-2xl" }) {
  return (
    <div className={`flex gap-1 ${size}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange && onChange(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          disabled={!onChange}
        >
          <Icon name="star" size={16} className={n <= value ? "text-amber-400 fill-amber-400" : "text-gray-300"} />
        </button>
      ))}
    </div>
  );
}

export default function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setUser(getUser());
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function load() {
    setLoading(true);
    apiFetch(`/api/products/${productId}/reviews`)
      .then((d) => {
        setReviews(d.reviews || []);
        setAverageRating(d.averageRating);
        setReviewCount(d.reviewCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  async function submitReview(e) {
    e.preventDefault();
    setError("");
    setMsg("");
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, comment: comment || undefined }),
      });
      setMsg(res.message || "Rəyiniz admin təsdiqindən sonra yayımlanacaq");
      setComment("");
      setRating(5);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const alreadyReviewed = user && reviews.some((r) => r.author?.id === user.id);

  return (
    <section className="mt-10">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-bold">Rəylər</h2>
        {averageRating != null && (
          <div className="flex items-center gap-1.5 text-sm">
            <Stars value={Math.round(averageRating)} size="text-base" />
            <span className="font-semibold">{averageRating.toFixed(1)}</span>
            <span className="text-gray-400">({reviewCount})</span>
          </div>
        )}
      </div>

      {/* Review form — any logged-in user */}
      {!user ? (
        <p className="text-sm text-gray-500 card p-4">
          Rəy yazmaq üçün{" "}
          <a href="/login" className="text-brand-700 font-semibold hover:underline">
            daxil olun
          </a>
          .
        </p>
      ) : alreadyReviewed ? (
        <p className="text-sm text-gray-500 card p-4 flex items-center gap-2"><Icon name="heart" size={18} className="text-brand-600 shrink-0" /> Bu məhsula artıq rəy yazmısınız, təşəkkürlər</p>
      ) : (
        <form onSubmit={submitReview} className="card p-4 space-y-3 mb-5">
          <p className="text-sm font-semibold">Rəy yazın</p>
          <Stars value={rating} onChange={setRating} />
          <textarea
            placeholder="Məhsul haqqında fikrinizi yazın (istəyə bağlı)"
            className="input-field"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{error}</p>}
          {msg && (
            <p className="text-sm text-brand-700 bg-brand-50 rounded-lg p-2 flex items-center gap-2">
              <Icon name="clock" size={16} className="text-amber-500 inline mr-1" /> {msg}
            </p>
          )}
          <button className="btn-primary" disabled={submitting}>
            {submitting ? "Göndərilir..." : "Rəyi göndər"}
          </button>
          <p className="text-[11px] text-gray-400">
            Rəyiniz admin tərəfindən yoxlandıqdan sonra hər kəsə görünəcək.
          </p>
        </form>
      )}

      {/* Approved reviews list */}
      {loading ? (
        <p className="text-sm text-gray-400">Yüklənir...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-400">Hələ təsdiqlənmiş rəy yoxdur.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{r.author?.fullName || "İstifadəçi"}</span>
                  {!r.isApproved && (
                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                      Gözləmədə
                    </span>
                  )}
                </div>
                <Stars value={r.rating} size="text-sm" />
              </div>
              {r.comment && <p className="text-sm text-gray-700">{r.comment}</p>}
              <p className="text-[11px] text-gray-400 mt-1">
                {new Date(r.createdAt).toLocaleDateString("az-AZ")}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
