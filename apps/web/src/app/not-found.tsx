import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-primary p-6 text-center">
      <h1 className="text-6xl font-extrabold tracking-tight mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
      <p className="text-muted max-w-md mb-6">
        The requested resource or route could not be found or you do not have permission to access it.
      </p>
      <Link
        href="/dashboard"
        className="px-5 py-2.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-opacity"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
