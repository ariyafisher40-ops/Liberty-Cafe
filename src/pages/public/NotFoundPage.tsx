import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';

export function NotFoundPage() {
  return (
    <PublicLayout>
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <p className="font-mono-tabular text-xs font-semibold tracking-[0.2em] text-[#D4AF37]">
          404 · PAGE NOT FOUND
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-[#F7F5EF]">
          This Page Could Not Be Found
        </h1>
        <p className="mt-3 text-sm text-[#AAA69C]">
          The route you requested does not exist or may have moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center rounded-md bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-[#0B0B0D] hover:bg-[#E7CB78]"
          >
            Return Home
          </Link>
          <Link
            to="/menu"
            className="inline-flex min-h-11 items-center rounded-md border border-[#343238] bg-[#151518] px-6 py-2.5 text-sm font-medium text-[#F7F5EF] hover:border-[#D4AF37]"
          >
            Explore Menu
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
