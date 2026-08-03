export default function TopBar() {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-8">
      <h2 className="text-2xl font-semibold">
        JobClokr
      </h2>

      <div className="flex items-center gap-6">
        <button className="text-2xl">🌙</button>
        <button className="text-2xl">🔔</button>

        <div className="font-medium">
          Lucas
        </div>
      </div>
    </header>
  );
}