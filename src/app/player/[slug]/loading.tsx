import { Skeleton } from '@/components/common/Skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background pb-20 pt-24">
      <div className="mx-auto max-w-[1560px] space-y-8 px-4 md:px-8 xl:px-12">
        <Skeleton className="h-4 w-72 rounded-full" />
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Skeleton className="aspect-video rounded-[2rem]" />
            <Skeleton className="h-72 rounded-[2rem]" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[420px] rounded-[2rem]" />
            <Skeleton className="h-48 rounded-[2rem]" />
          </div>
        </div>
      </div>
    </div>
  );
}
