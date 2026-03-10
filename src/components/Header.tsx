import { TickerSearch } from "./TickerSearch";

export function Header() {
  return (
    <header className="border-b border-gray-700 bg-gray-900 px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <h1 className="text-xl font-bold text-white">
          Market Crusher
        </h1>
        <TickerSearch />
      </div>
    </header>
  );
}
