import Link from 'next/link';
import Hero from '@/components/movie/Hero';
import MovieCarousel from '@/components/movie/MovieCarousel';
import ContinueWatchingBoundary from '@/components/movie/ContinueWatchingBoundary';
import FavoritesBoundary from '@/components/movie/FavoritesBoundary';
import { SkeletonHero } from '@/components/common/Skeleton';
import { debugWarn } from '@/lib/debug';
import { HOME_DISCOVER_CARDS, getHomePageData } from '@/lib/catalog';

export const revalidate = 1800;

export default async function Home() {
  let homeData: Awaited<ReturnType<typeof getHomePageData>> | null = null;

  try {
    homeData = await getHomePageData();
  } catch (error) {
    debugWarn('Home page data fetch failed', error);
  }

  if (!homeData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="text-5xl font-semibold text-white">PhimHay</h1>
        <p className="mt-4 max-w-lg text-white/55">
          Không thể tải được kho phim ở trang chủ lúc này. Hãy thử tải lại sau ít phút.
        </p>
      </div>
    );
  }

  const { heroMovie, spotlightMovies, sections, totalTitles } = homeData;

  return (
    <div className="pb-20">
      {heroMovie ? (
        <Hero movie={heroMovie} spotlightMovies={spotlightMovies} totalTitles={totalTitles} />
      ) : (
        <SkeletonHero />
      )}

      <div className="relative z-10 -mt-12 space-y-10 md:-mt-20">
        <section className="px-4 md:px-8 xl:px-12">
          <div className="mx-auto grid max-w-[1560px] gap-4 md:grid-cols-2 xl:grid-cols-4">
            {HOME_DISCOVER_CARDS.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="rounded-[1.8rem] border border-white/8 bg-white/[0.04] p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/16 hover:bg-white/[0.06]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/35">Nâng cấp</p>
                <h2 className="mt-3 text-xl font-semibold text-white">{card.title}</h2>
                <p className="mt-3 text-sm leading-6 text-white/55">{card.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <ContinueWatchingBoundary />
        <FavoritesBoundary />

        <div className="space-y-10">
          {sections.map((section) => (
            <MovieCarousel
              key={section.title}
              title={section.title}
              description={section.subtitle}
              movies={section.movies}
              href={section.href}
              accent={section.accent}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
