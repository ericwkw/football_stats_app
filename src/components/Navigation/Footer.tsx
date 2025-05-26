import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p>&copy; {new Date().getFullYear()} Football Stats App. All rights reserved.</p>
          </div>
          <div className="flex space-x-6">
            <Link href="/" className="hover:text-blue-300">Home</Link>
            <Link href="/teams" className="hover:text-blue-300">Teams</Link>
            <Link href="/players" className="hover:text-blue-300">Players</Link>
            <Link href="/matches" className="hover:text-blue-300">Matches</Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 