// src/app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-gray-900">
          Bienvenue sur <span className="text-blue-600">CampusHub</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          La plateforme qui connecte étudiants, alumni et opportunités
        </p>
        <div className="flex gap-4 justify-center">
          <Link href={'/login'} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Commencer
          </Link>
          <button className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
            En savoir plus
          </button>
        </div>
      </div>
    </main>
  );
}