'use client';

export default function AdminFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-4 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex justify-center items-center">
          <p className="text-gray-500 text-sm">
            © {currentYear} Football Stats App Admin Panel. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 