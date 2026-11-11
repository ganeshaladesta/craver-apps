export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-7">
          <div className="h-7 w-56 animate-pulse rounded-full bg-[#FAFAFA]" />
          <div className="h-14 w-full animate-pulse rounded-xl bg-[#FAFAFA]" />
          <div className="h-12 w-3/4 animate-pulse rounded-xl bg-[#FAFAFA]" />
          <div className="h-16 w-full animate-pulse rounded-2xl bg-[#FAFAFA]" />
        </div>
        <div className="lg:col-span-5">
          <div className="aspect-[4/5] w-full animate-pulse rounded-2xl bg-[#FAFAFA]" />
        </div>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white"
          >
            <div className="aspect-[4/3] w-full animate-pulse bg-[#FAFAFA]" />
            <div className="space-y-3 p-4">
              <div className="h-5 w-2/3 animate-pulse rounded bg-[#FAFAFA]" />
              <div className="h-3.5 w-1/2 animate-pulse rounded bg-[#FAFAFA]" />
              <div className="h-3.5 w-full animate-pulse rounded bg-[#FAFAFA]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

