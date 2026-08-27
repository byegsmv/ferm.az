"use client";

import React from 'react';
import { Link } from "@/i18n/routing";
import Icon from './ui/Icon';
import { useSiteTexts } from "@/lib/siteTexts";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { t: st } = useSiteTexts();
  const phone = st("footer.phone", "+994 10 223 89 89");
  const phoneTel = phone.replace(/[^\d+]/g, "");
  const whatsappPhone = st("footer.whatsappPhone", phoneTel);
  const email = st("footer.email", "info@fermermarket.az");
  const facebookUrl = st("footer.facebookUrl", "https://www.facebook.com/people/Fermer-MarketAz/100092373625442");
  const instagramUrl = st("footer.instagramUrl", "https://www.instagram.com/fermermarket.mmc/");
  
  return (
    <footer className="relative bg-gray-900 text-gray-300 pt-12 md:pt-16 pb-16 md:pb-20 mt-8 md:mt-12">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent" />
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
        
        {/* Brand & Description */}
        <div className="col-span-1 sm:col-span-2 md:col-span-1 flex flex-col gap-4">
          <Link href="/" className="flex items-center group w-fit">
            <img src="/logo.png" alt="FermerMarket Logo" className="h-10 md:h-12 w-auto object-contain group-hover:scale-105 transition-transform duration-200" />
          </Link>
          <p className="text-sm text-gray-400">
            Fermerlər, mağazalar, aqronomlar və alıcılar üçün AI dəstəkli vahid kənd təsərrüfatı ekosistemi.
          </p>
          <div className="flex gap-4 mt-2">
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-colors">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
            </a>
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#E1306C] hover:text-white transition-colors">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a href={`https://wa.me/${whatsappPhone.replace("+","")}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-colors">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.385 0 12.032c0 2.13.551 4.19 1.597 6.012L.15 24l6.104-1.602a11.967 11.967 0 005.777 1.493c6.646 0 12.031-5.386 12.031-12.032C24.062 5.385 18.677 0 12.031 0zm7.151 17.202c-.307.865-1.782 1.583-2.464 1.636-.629.049-1.439.117-4.61-1.196-3.799-1.574-6.241-5.449-6.433-5.705-.189-.256-1.536-2.046-1.536-3.9 0-1.854.968-2.766 1.314-3.15.345-.383.753-.48 1.003-.48.249 0 .5.002.723.013.232.012.544-.088.852.656.319.768 1.09 2.666 1.189 2.868.098.203.164.44.032.705-.132.266-.201.43-.401.664-.199.234-.415.516-.596.691-.197.189-.404.398-.179.78.225.381 1.003 1.652 2.152 2.678 1.487 1.327 2.738 1.737 3.13 1.933.393.197.622.164.853-.1.232-.266.994-1.164 1.258-1.564.264-.4.529-.333.886-.197.357.135 2.253 1.06 2.64 1.258.386.197.643.296.737.461.093.164.093.957-.214 1.822z"/></svg>
            </a>
          </div>
        </div>

        {/* Links Column 1 - Platforma */}
        <div>
          <h3 className="text-white font-bold mb-4">Platforma</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/products" className="hover:text-brand-400 transition-colors">Elanlar</Link></li>
            <li><Link href="/categories" className="hover:text-brand-400 transition-colors">Kateqoriyalar</Link></li>
            <li><Link href="/stores" className="hover:text-brand-400 transition-colors">Mağazalar</Link></li>
            <li><Link href="/campaigns" className="hover:text-brand-400 transition-colors">Kampaniyalar</Link></li>
            <li><Link href="/elan-yerlesdir" className="hover:text-brand-400 transition-colors flex items-center gap-2">Elan Yerləşdir <span className="bg-brand-600/20 text-brand-400 px-1.5 py-0.5 rounded text-[10px] font-bold">+</span></Link></li>
          </ul>
        </div>

        {/* Links Column 2 - Xidmətlər */}
        <div>
          <h3 className="text-white font-bold mb-4">Xidmətlər & Məlumat</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/agronom" className="hover:text-brand-400 transition-colors flex items-center gap-2">AI Aqronom <span className="bg-brand-600/20 text-brand-400 px-1.5 py-0.5 rounded text-[10px] font-bold">YENİ</span></Link></li>
            <li><Link href="/farmer-club" className="hover:text-brand-400 transition-colors">Fermer Klubu</Link></li>
            <li><Link href="/blog" className="hover:text-brand-400 transition-colors">Bloq</Link></li>
            <li><Link href="/leaderboard" className="hover:text-brand-400 transition-colors">Liderlər Lövhəsi</Link></li>
            <li><Link href="/cart" className="hover:text-brand-400 transition-colors">Səbət</Link></li>
            <li><Link href="/favorites" className="hover:text-brand-400 transition-colors">Seçilmişlər</Link></li>
          </ul>
        </div>

        {/* Links Column 3 - Əlaqə & Şirkət */}
        <div>
          <h3 className="text-white font-bold mb-4">Əlaqə & Şirkət</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-brand-400 transition-colors">Haqqımızda</Link></li>
            <li><Link href="/contact" className="hover:text-brand-400 transition-colors">Əlaqə</Link></li>
            <li><Link href="/dashboard" className="hover:text-brand-400 transition-colors">Hesabım</Link></li>
            <li><Link href="/register" className="hover:text-brand-400 transition-colors">Qeydiyyat</Link></li>
            <li>
              <a href={`tel:${phoneTel}`} className="flex items-center gap-2 hover:text-brand-400 transition-colors">
                <Icon name="phone" size={16} className="text-brand-500" /> {phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-brand-400 transition-colors">
                <Icon name="message" size={16} className="text-brand-500" /> {email}
              </a>
            </li>
          </ul>
        </div>

      </div>
      
      <div className="max-w-6xl mx-auto px-4 mt-12 pt-6 border-t border-gray-800 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-gray-500">© {currentYear} FermerMarket. Bütün hüquqlar qorunur. Designed By AzVeb Media Marketing Agency</p>
        <div className="flex gap-4">
          <Link href="/terms" className="text-gray-500 hover:text-white transition-colors">İstifadə qaydaları</Link>
          <Link href="/privacy" className="text-gray-500 hover:text-white transition-colors">Məxfilik siyasəti</Link>
        </div>
      </div>
    </footer>
  );
}
