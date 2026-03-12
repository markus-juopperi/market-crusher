import Link from "next/link";
import { TickerSearch } from "./TickerSearch";

export function Header() {
  return (
    <header className="border-b border-gray-700 bg-gray-900 px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-white">
            <Link href="/">Market Crusher</Link>
          </h1>
          <Link
            href="/compare"
            className="text-sm text-gray-400 hover:text-white"
          >
            Compare
          </Link>
        </div>
        <TickerSearch />
      </div>
    </header>
  );
}
