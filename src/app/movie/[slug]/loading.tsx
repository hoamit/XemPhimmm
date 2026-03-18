import { Skeleton } from '@/components/common/Skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen pb-20">
      <div className="relative h-[58vh] overflow-hidden border-b border-white/8 bg-black">
        <Skeleton className="h-full w-full rounded-none" />
      </div>

      <div className="mx-auto -mt-24 max-w-[1700px] space-y-8 px-4 md:px-8 xl:px-12">
        <div className="grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-4">
            <Skeleton className="aspect-[2/3] w-full max-w-[320px] rounded-[2rem]" />
            <Skeleton className="h-12 w-full max-w-[320px] rounded-full" />
            <Skeleton className="h-12 w-full max-w-[320px] rounded-full" />
          </div>

          <div className="space-y-6">
            <Skeleton className="h-8 w-40 rounded-full" />
            <Skeleton className="h-14 w-2/3 rounded-[1.6rem]" />
            <Skeleton className="h-6 w-1/2 rounded-full" />
            <div className="grid gap-4 md:grid-cols-3">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-24 rounded-[1.5rem]" />
              ))}
            </div>
            <Skeleton className="h-44 rounded-[2rem]" />
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Skeleton className="h-72 rounded-[2rem]" />
              <Skeleton className="h-72 rounded-[2rem]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
