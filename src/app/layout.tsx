import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Receipt2Plate - Zero-Waste AI Kitchen Planner',
  description: 'Convert receipts into virtual pantry items and generate zero-waste recipes using Gemini AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen flex flex-col font-sans">
        <header className="bg-emerald-700 text-white py-4 px-6 shadow-md">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">🥗 Receipt2Plate</h1>
              <p className="text-emerald-100 text-xs">Zero-Waste AI Kitchen Planner</p>
            </div>
            <span className="text-xs bg-emerald-800 text-emerald-200 px-3 py-1 rounded-full border border-emerald-600">
              Powered by Gemini 1.5 Flash
            </span>
          </div>
        </header>

        <main className="flex-grow">{children}</main>

        <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          Receipt2Plate &copy; 2026 — Built for Zero-Waste Cooking
        </footer>
      </body>
    </html>
  );
}