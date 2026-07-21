export default function ProjectDetailLoading() {
  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5" aria-label="Đang tải chi tiết dự án">
        <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="h-4 w-36 animate-pulse rounded bg-slate-800" />
            <div className="h-7 w-72 animate-pulse rounded bg-slate-800" />
            <div className="h-4 w-56 animate-pulse rounded bg-slate-900" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-32 animate-pulse rounded-lg border border-slate-800 bg-slate-900" />
            <div className="h-9 w-28 animate-pulse rounded-lg border border-slate-800 bg-slate-900" />
          </div>
        </div>

        <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="h-3 w-24 animate-pulse rounded bg-slate-800" />
              <div className="h-8 w-20 animate-pulse rounded bg-slate-800" />
              <div className="h-2 w-full animate-pulse rounded-full bg-slate-800 lg:w-96" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-3 w-16 animate-pulse rounded bg-slate-800" />
                  <div className="h-4 w-20 animate-pulse rounded bg-slate-800" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <section className="rounded-lg border border-slate-800 bg-slate-900">
              <div className="border-b border-slate-800 px-4 py-3">
                <div className="h-5 w-36 animate-pulse rounded bg-slate-800" />
                <div className="mt-2 h-3 w-64 animate-pulse rounded bg-slate-800" />
              </div>
              <div className="flex gap-4 overflow-hidden p-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex w-36 shrink-0 flex-col items-center gap-2 sm:w-44">
                    <div className="h-9 w-9 animate-pulse rounded-full bg-slate-800" />
                    <div className="h-4 w-28 animate-pulse rounded bg-slate-800" />
                    <div className="h-3 w-16 animate-pulse rounded bg-slate-800" />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-800 bg-slate-900">
              <div className="border-b border-slate-800 px-4 py-3">
                <div className="h-5 w-40 animate-pulse rounded bg-slate-800" />
                <div className="mt-2 h-3 w-72 animate-pulse rounded bg-slate-800" />
              </div>
              <div className="space-y-2 p-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-12 animate-pulse rounded bg-slate-800/60" />
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="h-40 animate-pulse rounded-lg border border-slate-800 bg-slate-900" />
            <div className="h-56 animate-pulse rounded-lg border border-slate-800 bg-slate-900" />
          </aside>
        </div>
      </div>
    </main>
  );
}
