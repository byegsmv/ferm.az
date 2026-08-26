"use client";
import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/Icon";

export default function CategorySelector({ categories, defaultValue }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState({});
  const dropdownRef = useRef(null);

  // Find selected category and automatically expand its parent
  useEffect(() => {
    if (!defaultValue) {
      setSelected(null);
      return;
    }
    let found = false;
    for (const c of categories) {
      if (c.slug === defaultValue) {
        setSelected({ id: c.id, name: c.nameAz, icon: c.icon, slug: c.slug, isParent: true });
        setExpanded(prev => ({ ...prev, [c.id]: true }));
        found = true;
        break;
      }
      for (const ch of c.children) {
        if (ch.slug === defaultValue) {
          setSelected({ id: ch.id, name: ch.nameAz, icon: c.icon, parentId: c.id, slug: ch.slug, isParent: false });
          setExpanded(prev => ({ ...prev, [c.id]: true }));
          found = true;
          break;
        }
        if (ch.children) {
          for (const gch of ch.children) {
            if (gch.slug === defaultValue) {
              setSelected({ id: gch.id, name: gch.nameAz, icon: c.icon, parentId: ch.id, slug: gch.slug, isParent: false });
              setExpanded(prev => ({ ...prev, [c.id]: true, [ch.id]: true }));
              found = true;
              break;
            }
          }
        }
        if (found) break;
      }
      if (found) break;
    }
  }, [defaultValue, categories]);

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelect = (slug, name, icon, isParent, id, parentId) => {
    setSelected(slug ? { id, name, icon, slug, isParent, parentId } : null);
    setIsOpen(false);
  };

  const toggleExpand = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Hidden Input for Form Submission */}
      <input type="hidden" name="category" value={selected?.slug || ""} />

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border border-[var(--border)] bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-500 transition-all duration-300 select-none cursor-pointer"
      >
        <span className="flex items-center gap-2 text-gray-700 font-medium">
          {selected ? (
            <div className="flex items-center gap-3">
              <span className="text-base shrink-0 text-brand-600">
                {selected.icon ? (
                  (selected.icon.length <= 2 || selected.icon.includes("http")) 
                    ? (selected.icon.includes("http") ? <img src={selected.icon} alt="" className="w-5 h-5 object-contain" /> : <span>{selected.icon}</span>)
                    : <Icon name={selected.icon} size={18} />
                ) : <Icon name="sprout" size={16} />}
              </span>
              <span className="whitespace-normal break-words text-left">{selected.name}</span>
            </div>
          ) : (
            <span className="text-gray-400">Bütün kateqoriyalar</span>
          )}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown Box */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 max-h-80 overflow-y-auto bg-white/95 backdrop-blur-md border border-gray-150 rounded-2xl shadow-xl z-50 p-1.5 scrollbar-thin">
          {/* Default option */}
          <button
            type="button"
            onClick={() => handleSelect("", "Bütün kateqoriyalar", null, false)}
            className={`w-full flex items-center px-3 py-2.5 text-sm rounded-xl transition-all text-left font-semibold ${
              !selected ? "bg-brand-50 text-brand-700 font-bold" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center gap-1.5"><Icon name="folder" size={16} className="text-brand-600" /> Bütün kateqoriyalar</span>
          </button>

          {/* Categories list */}
          {categories.map((c) => {
            const isParentSelected = selected?.slug === c.slug;
            const isExpanded = !!expanded[c.id];
            const hasChildren = c.children && c.children.length > 0;

            return (
              <div key={c.id} className="mt-1 border-t border-gray-50 pt-1 first:border-0 first:pt-0">
                {/* Parent Row Container */}
                <div className="flex items-center justify-between gap-1 w-full rounded-xl hover:bg-gray-50 transition-all pr-1">
                  {/* Parent select action */}
                  <button
                    type="button"
                    onClick={() => handleSelect(c.slug, c.nameAz, c.icon, true, c.id)}
                    className={`flex-1 flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-xl transition-all text-left ${
                      isParentSelected ? "bg-brand-50/80 text-brand-700" : "text-gray-900"
                    }`}
                  >
                    <span className="text-base shrink-0 text-brand-600">
                      {c.icon ? (
                        (c.icon.length <= 2 || c.icon.includes("http")) 
                          ? (c.icon.includes("http") ? <img src={c.icon} alt="" className="w-5 h-5 object-contain" /> : <span>{c.icon}</span>)
                          : <Icon name={c.icon} size={18} />
                      ) : <Icon name="sprout" size={16} />}
                    </span>
                    <span className="whitespace-normal break-words">{c.nameAz}</span>
                  </button>

                  {/* Accordion Toggle Chevron (only if category has children) */}
                  {hasChildren && (
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(c.id, e)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200/60 text-gray-400 hover:text-gray-700 transition-all shrink-0 ${
                        isExpanded ? "bg-gray-100/50 text-gray-600" : ""
                      }`}
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-300 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Subcategories (Children Accordion) */}
                {hasChildren && isExpanded && (
                  <div className="pl-3 mt-1 border-l-2 border-brand-200 ml-6 flex flex-col gap-0.5 animate-fade-in">
                    {c.children.map((ch) => {
                      const isChildSelected = selected?.slug === ch.slug;
                      const hasGrandChildren = ch.children && ch.children.length > 0;
                      const isChildExpanded = !!expanded[ch.id];

                      return (
                        <div key={ch.id} className="flex flex-col">
                          <div className="flex items-center justify-between w-full rounded-lg hover:bg-gray-50 pr-1">
                            <button
                              type="button"
                              onClick={() => handleSelect(ch.slug, ch.nameAz, c.icon, false, ch.id, c.id)}
                              className={`flex-1 flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all text-left ${
                                isChildSelected
                                  ? "bg-brand-50/70 text-brand-700"
                                  : "text-gray-600 hover:text-gray-900"
                              }`}
                            >
                              <Icon name="arrowRight" size={12} className="text-gray-400 shrink-0" />
                              <span className="whitespace-normal break-words">{ch.nameAz}</span>
                            </button>
                            
                            {hasGrandChildren && (
                              <button
                                type="button"
                                onClick={(e) => toggleExpand(ch.id, e)}
                                className={`w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-200/60 text-gray-400 transition-all shrink-0 ${
                                  isChildExpanded ? "bg-gray-100/50 text-gray-600" : ""
                                }`}
                              >
                                <svg
                                  className={`w-3 h-3 transition-transform duration-300 ${
                                    isChildExpanded ? "rotate-180" : ""
                                  }`}
                                  fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                                >
                                  <path d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            )}
                          </div>

                          {/* Grandchildren */}
                          {hasGrandChildren && isChildExpanded && (
                            <div className="pl-4 mt-0.5 ml-3 border-l-2 border-gray-100 flex flex-col gap-0.5">
                              {ch.children.map((gch) => {
                                const isGrandChildSelected = selected?.slug === gch.slug;
                                return (
                                  <button
                                    key={gch.id}
                                    type="button"
                                    onClick={() => handleSelect(gch.slug, gch.nameAz, c.icon, false, gch.id, ch.id)}
                                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium rounded-md transition-all text-left ${
                                      isGrandChildSelected
                                        ? "bg-brand-50/50 text-brand-700 font-bold"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                                    }`}
                                  >
                                    <span className="text-gray-300 shrink-0">-</span>
                                    <span className="whitespace-normal break-words">{gch.nameAz}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
