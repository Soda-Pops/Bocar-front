// Not used by active screens yet; reserved for future integration.
type SidebarProps = {
  menuItems: readonly string[];
};

// Sidebar is isolated so navigation can evolve independently from dashboard content.
export function Sidebar({ menuItems }: SidebarProps) {
  return (
    <nav className="flex min-h-screen w-60 flex-shrink-0 flex-col bg-[#123f84] px-5 pb-8 pt-8 text-white">
      <div className="px-5 pt-1">
        <h1 className="text-[28px] font-semibold tracking-tight">BOCAR</h1>
      </div>

      <div className="mt-28 flex flex-col gap-7">
        <div className="px-[14px]">
          <button
            type="button"
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#2b5cac] px-4 text-[16px] font-semibold text-white"
          >
            DASHBOARD
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {menuItems.map((item) => (
            <button
              key={item}
              type="button"
              className="flex min-h-[56px] items-center justify-center px-3 text-center text-[16px] font-semibold leading-6 text-white transition-opacity hover:opacity-85"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
