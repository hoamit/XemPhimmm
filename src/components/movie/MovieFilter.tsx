'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

const GENRES = [
  { label: 'Thể loại', value: '' },
  { label: 'Hành động', value: 'hanh-dong' },
  { label: 'Tình cảm', value: 'tinh-cam' },
  { label: 'Hài hước', value: 'hai-huoc' },
  { label: 'Cổ trang', value: 'co-trang' },
  { label: 'Tâm lý', value: 'tam-ly' },
  { label: 'Hình sự', value: 'hinh-su' },
  { label: 'Chiến tranh', value: 'chien-tranh' },
  { label: 'Thể thao', value: 'the-thao' },
  { label: 'Võ thuật', value: 'vo-thuat' },
  { label: 'Viễn tưởng', value: 'vien-tuong' },
  { label: 'Phiêu lưu', value: 'phieu-luu' },
  { label: 'Khoa học', value: 'khoa-hoc' },
  { label: 'Kinh dị', value: 'kinh-di' },
  { label: 'Âm nhạc', value: 'am-nhac' },
  { label: 'Thần thoại', value: 'than-thoai' },
  { label: 'Tài liệu', value: 'tai-lieu' },
  { label: 'Gia đình', value: 'gia-dinh' },
  { label: 'Chính kịch', value: 'chinh-kich' },
];

const COUNTRIES = [
  { label: 'Quốc gia', value: '' },
  { label: 'Trung Quốc', value: 'trung-quoc' },
  { label: 'Hàn Quốc', value: 'han-quoc' },
  { label: 'Nhật Bản', value: 'nhat-ban' },
  { label: 'Thái Lan', value: 'thai-lan' },
  { label: 'Âu Mỹ', value: 'au-my' },
  { label: 'Đài Loan', value: 'dai-loan' },
  { label: 'Hồng Kông', value: 'hong-kong' },
  { label: 'Việt Nam', value: 'viet-nam' },
];

const currentYear = new Date().getFullYear();
const YEARS = [
  { label: 'Năm phát hành', value: '' },
  ...Array.from({ length: 20 }, (_, i) => {
    const year = currentYear - i;
    return { label: String(year), value: String(year) };
  }),
];

const LANGUAGES = [
  { label: 'Ngôn Ngữ', value: '' },
  { label: 'Vietsub', value: 'vietsub' },
  { label: 'Thuyết Minh', value: 'thuyet-minh' },
  { label: 'Lồng Tiếng', value: 'long-tieng' },
];

const SORTS = [
  { label: 'Sắp xếp', value: '' },
  { label: 'Mới cập nhật', value: 'modified.time' },
  { label: 'Năm phát hành', value: 'year' },
  { label: 'Tên phim', value: 'name' },
];

const FORMATS = [
  { label: 'Hình thức', value: '' },
  { label: 'Phim bộ', value: 'phim-bo' },
  { label: 'Phim lẻ', value: 'phim-le' },
  { label: 'Hoạt hình', value: 'hoat-hinh' },
  { label: 'TV Shows', value: 'tv-shows' },
];

const MovieFilter: React.FC<{ currentType?: string }> = ({ currentType }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    country: searchParams.get('country') || '',
    year: searchParams.get('year') || '',
    lang: searchParams.get('lang') || '',
    sort: searchParams.get('sort') || 'modified.time',
    type: searchParams.get('type') || currentType || '',
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilter = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    
    // If we're on a type page and the type changed, go to the new type page, else stay on current or go to search
    if (filters.type && filters.type !== currentType) {
      router.push(`/type/${filters.type}?${params.toString()}`);
    } else {
      router.push(`${window.location.pathname}?${params.toString()}`);
    }
  };

  return (
    <div className="rounded-[2rem] border border-white/8 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="filter-select"
        >
          {GENRES.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>

        <select
          value={filters.country}
          onChange={(e) => handleFilterChange('country', e.target.value)}
          className="filter-select"
        >
          {COUNTRIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        <select
          value={filters.year}
          onChange={(e) => handleFilterChange('year', e.target.value)}
          className="filter-select"
        >
          {YEARS.map((y) => (
            <option key={y.value} value={y.value}>{y.label}</option>
          ))}
        </select>

        <select
          value={filters.lang}
          onChange={(e) => handleFilterChange('lang', e.target.value)}
          className="filter-select"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>

        <select
          value={filters.sort}
          onChange={(e) => handleFilterChange('sort', e.target.value)}
          className="filter-select"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <select
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          className="filter-select"
        >
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        <button
          onClick={handleApplyFilter}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
        >
          <Search className="size-4" />
          Tìm kiếm
        </button>
      </div>

      <style jsx>{`
        .filter-select {
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 0.6rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          outline: none;
          cursor: pointer;
          min-width: 140px;
          transition: all 0.2s;
        }
        .filter-select:hover {
          background-color: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }
        .filter-select option {
          background-color: #0a0a0a;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default MovieFilter;
