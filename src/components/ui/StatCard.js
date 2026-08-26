"use client";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";

function useCountUp(target, started) {
  const [count, setCount] = useState(0);
  useEffect(()=>{
    if (!started || !target) { setCount(target||0); return; }
    let cur=0; const step=target/(1200/16);
    const t=setInterval(()=>{ cur+=step; if(cur>=target){setCount(target);clearInterval(t);}else setCount(Math.floor(cur)); },16);
    return ()=>clearInterval(t);
  },[target,started]);
  return count;
}

export default function StatCard({ icon, label, value, suffix="", prefix="", change, color="brand", loading }) {
  const [started, setStarted] = useState(false);
  const ref = useRef(null);
  const num = useCountUp(typeof value==="number"?value:0, started);

  useEffect(()=>{
    const obs=new IntersectionObserver(([e])=>{ if(e.isIntersecting){setStarted(true);obs.disconnect();} },{threshold:0.3});
    if(ref.current) obs.observe(ref.current);
    return ()=>obs.disconnect();
  },[]);

  const colors = {
    brand: "bg-brand-50 text-brand-700",
    amber:  "bg-amber-50 text-amber-700",
    red:    "bg-red-50 text-red-600",
    blue:   "bg-sky-50 text-sky-700",
    purple: "bg-purple-50 text-purple-700",
    gray:   "bg-gray-100 text-gray-600",
  };

  if (loading) return <div className="card p-5 animate-pulse"><div className="skeleton h-24 rounded-xl" /></div>;

  return (
    <div ref={ref} className="stat-card hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between">
        <span className={`w-10 h-10 rounded-2xl flex items-center justify-center ${colors[color]||colors.brand}`}>
          {typeof icon === "string" ? <Icon name={icon} size={20} /> : icon}
        </span>
        {change !== undefined && (
          <span className={`badge text-[10px] ${Number(change)>=0?"badge-green":"badge-red"}`}>
            <Icon name={Number(change)>=0 ? "arrowUp" : "arrowDown"} size={12} className="inline mr-0.5" /> {Math.abs(change)}%
          </span>
        )}
      </div>
      <div>
        <div className="stat-value text-gray-900">
          {prefix}{typeof value==="number"?num.toLocaleString("az-AZ"):value||0}{suffix}
        </div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
