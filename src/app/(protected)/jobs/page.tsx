// src/app/(protected)/jobs/page.tsx
export default function JobsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Offres d'emploi</h1>
      <p className="text-gray-600">Liste des offres à venir...</p>
    </div>
  );
}
// // src/app/jobs/page.tsx
// import { JobList } from '@/components/jobs/JobList';

// export default function JobsPage() {
//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
//       {/* Header */}
//       <div className="bg-white border-b border-gray-200">
//         <div className="container mx-auto px-4 py-8">
//           <h1 className="text-4xl font-bold text-gray-900 mb-2">
//             Offres d'emploi
//           </h1>
//           <p className="text-gray-600">
//             Découvrez les opportunités qui correspondent à votre profil
//           </p>
//         </div>
//       </div>

//       {/* Content */}
//       <div className="container mx-auto px-4 py-8">
//         <JobList />
//       </div>
//     </div>
//   );
// }