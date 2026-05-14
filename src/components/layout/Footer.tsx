import Image from 'next/image';
import Link from 'next/link';
import { NAV_LINKS, TYPE_CONFIG } from '@/lib/catalog';

const Footer: React.FC = () => {
  return (
    <footer className="mt-24 border-t border-white/8 bg-[linear-gradient(180deg,rgba(10,10,10,0.8),rgba(7,7,7,1))] px-4 py-14 md:px-8 lg:px-12">
      <div className="mx-auto grid max-w-[1560px] gap-10 lg:grid-cols-[1.2fr_0.9fr_0.9fr]">
        <div className="space-y-5">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5">
            <Image src="/phimhay-logo-crop.png" alt="PhimHay" width={220} height={64} className="h-11 w-auto" />
          </div>

          <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-white">
            Giao diện mới tập trung vào kho phim dày hơn, load ổn hơn và thao tác xem mượt hơn.
          </h2>
          <p className="max-w-2xl text-base leading-7 text-white/55">
            Dữ liệu được đồng bộ đa nguồn, xử lý trùng lặp trước khi render và tối ưu truy vấn theo bộ lọc.
            Mục tiêu là mở site lên có nhiều title để chọn ngay, không còn cảm giác feed quá mỏng.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/35">Đi nhanh</p>
          <div className="grid gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/72 transition-all duration-300 hover:border-white/16 hover:bg-white/[0.08] hover:text-white"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/35">Danh mục nổi bật</p>
          <div className="space-y-3">
            {Object.entries(TYPE_CONFIG).map(([type, config]) => (
              <Link
                key={type}
                href={`/type/${type}`}
                className="block rounded-[1.6rem] border border-white/8 bg-white/[0.04] px-4 py-4 transition-all duration-300 hover:border-white/16 hover:bg-white/[0.08]"
              >
                <p className="text-base font-semibold text-white">{config.label}</p>
                <p className="mt-1 text-sm leading-6 text-white/50">{config.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-[1560px] flex-col gap-3 border-t border-white/8 pt-6 text-sm text-white/35 md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} PhimHay. Tối ưu trải nghiệm xem phim mượt, nhanh và dày nội dung hơn.</p>
        <p>Built with Next.js và React.</p>
      </div>
    </footer>
  );
};

export default Footer;
