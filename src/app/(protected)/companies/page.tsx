// src/app/(protected)/companies/page.tsx
import { CompanyList } from '@/components/companies/CompanyList';

export default function CompaniesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Entreprises Partenaires
          </h1>
          <p className="text-gray-600">
            Découvrez nos entreprises partenaires et leurs opportunités
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <CompanyList />
      </div>
    </div>
  );
}
