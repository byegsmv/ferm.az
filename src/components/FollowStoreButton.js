"use client";

import { useState } from "react";
import { apiFetch, getToken } from "@/lib/apiClient";
import { useRouter } from "@/i18n/routing";
import Icon from "@/components/ui/Icon";

export default function FollowStoreButton({ storeId, initialFollowing, initialCount }) {
  const router = useRouter();
  const [following, setFollowing] = useState(!!initialFollowing);
  const [count, setCount] = useState(initialCount || 0);
  const [loading, setLoading] = useState(false);

  async function toggleFollow() {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch(`/api/stores/${storeId}/follow`, { method: "POST" });
      setFollowing(data.following);
      setCount(data.followerCount);
    } catch (err) {
      // Silent fail — non-critical action, avoid disrupting the storefront view
      console.error("Follow toggle error:", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggleFollow}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
        following
          ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
          : "bg-brand-600 text-white hover:bg-brand-700"
      } disabled:opacity-60`}
    >
      <Icon name={following ? "checkCircle" : "plus"} size={15} />
      {following ? "İzlənilir" : "İzlə"}
      <span className="opacity-70 font-normal">· {count}</span>
    </button>
  );
}
