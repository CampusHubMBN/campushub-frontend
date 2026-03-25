// src/app/page.tsx
import Link from 'next/link';
import {
  Briefcase, CalendarDays, FileText, Users, ArrowRight,
  GraduationCap, Building2, Star, TrendingUp, Bell, Globe,
} from 'lucide-react';

const features = [
  {
    icon: Briefcase,
    color: 'bg-blue-100 text-blue-600',
    title: 'Offres d\'emploi',
    description: 'Stages, alternances, CDI/CDD — des offres sélectionnées pour les étudiants et alumni MBN.',
  },
  {
    icon: CalendarDays,
    color: 'bg-violet-100 text-violet-600',
    title: 'Événements',
    description: 'Forums, ateliers, conférences et soirées networking organisés par le BDE et les partenaires.',
  },
  {
    icon: FileText,
    color: 'bg-emerald-100 text-emerald-600',
    title: 'Articles & Blog',
    description: 'Actualités, conseils carrière et retours d\'expérience publiés par la communauté.',
  },
  {
    icon: Bell,
    color: 'bg-orange-100 text-orange-600',
    title: 'Notifications temps réel',
    description: 'Suivez vos candidatures et inscriptions aux événements avec des alertes instantanées.',
  },
  {
    icon: Building2,
    color: 'bg-pink-100 text-pink-600',
    title: 'Espace recruteur',
    description: 'Les entreprises partenaires publient et gèrent leurs offres directement sur la plateforme.',
  },
  {
    icon: Globe,
    color: 'bg-teal-100 text-teal-600',
    title: 'Réseau alumni',
    description: 'Restez connecté à votre école et à la communauté des anciens élèves MBN.',
  },
];

const stats = [
  { value: '200+', label: 'Offres disponibles', icon: Briefcase },
  { value: '50+',  label: 'Entreprises partenaires', icon: Building2 },
  { value: '800+', label: 'Étudiants & alumni', icon: GraduationCap },
  { value: '30+',  label: 'Événements par an', icon: CalendarDays },
];

const roles = [
  {
    icon: GraduationCap,
    title: 'Étudiant / Alumni',
    color: 'border-blue-200 bg-blue-50',
    iconColor: 'text-blue-600 bg-blue-100',
    items: ['Postuler aux offres d\'emploi', 'S\'inscrire aux événements', 'Lire les articles & le blog', 'Suivre ses candidatures en temps réel'],
  },
  {
    icon: Building2,
    title: 'Entreprise / Recruteur',
    color: 'border-violet-200 bg-violet-50',
    iconColor: 'text-violet-600 bg-violet-100',
    items: ['Publier des offres de stage et d\'emploi', 'Gérer les candidatures reçues', 'Accéder au profil des candidats', 'Diffuser des offres externes'],
  },
  {
    icon: Star,
    title: 'BDE / Pédagogique',
    color: 'border-emerald-200 bg-emerald-50',
    iconColor: 'text-emerald-600 bg-emerald-100',
    items: ['Créer et publier des événements', 'Gérer la liste des participants', 'Publier des articles et actualités', 'Administrer le contenu éditorial'],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ───────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200">
              <span className="text-white font-black text-lg leading-none">C</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              CampusHub
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <Link href="/jobs"    className="hover:text-gray-900 transition-colors">Offres</Link>
            <Link href="/events"  className="hover:text-gray-900 transition-colors">Événements</Link>
            <Link href="/articles" className="hover:text-gray-900 transition-colors">Articles</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
              Se connecter
            </Link>
            <Link href="/login"
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 transition-opacity shadow-sm shadow-blue-200">
              Accéder à la plateforme
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100 rounded-full blur-[120px] opacity-40 -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-100 rounded-full blur-[100px] opacity-40 translate-y-1/2" />

        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100 mb-6">
            <TrendingUp className="h-3.5 w-3.5" />
            Plateforme officielle MBN Global Education
          </span>

          <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight mb-6">
            La plateforme des{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              étudiants MBN
            </span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Offres d'emploi, événements, articles et opportunités — tout ce dont vous avez besoin
            pour votre carrière, réuni en un seul endroit.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-base shadow-lg shadow-blue-200 hover:opacity-90 transition-opacity">
              Accéder à mon espace
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/jobs"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-base hover:bg-gray-50 transition-colors">
              Voir les offres
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────── */}
      <section className="py-14 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ value, label, icon: Icon }) => (
            <div key={label} className="text-center text-white">
              <Icon className="h-6 w-6 mx-auto mb-2 opacity-80" />
              <p className="text-3xl font-black">{value}</p>
              <p className="text-sm opacity-75 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Tout ce dont vous avez besoin</h2>
            <p className="text-gray-500 text-lg">Une seule plateforme pour votre vie étudiante et professionnelle.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, color, title, description }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`h-11 w-11 rounded-xl ${color} flex items-center justify-center mb-4`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Une plateforme pour chaque profil</h2>
            <p className="text-gray-500 text-lg">Étudiants, recruteurs et staff — chacun a son espace dédié.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {roles.map(({ icon: Icon, title, color, iconColor, items }) => (
              <div key={title} className={`rounded-2xl p-6 border ${color}`}>
                <div className={`h-11 w-11 rounded-xl ${iconColor} flex items-center justify-center mb-4`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
            <span className="text-white font-black text-2xl leading-none">C</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Prêt à rejoindre la communauté ?
          </h2>
          <p className="text-gray-500 mb-8 text-lg">
            Connectez-vous avec votre compte MBN pour accéder à toutes les fonctionnalités.
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-base shadow-lg shadow-blue-200 hover:opacity-90 transition-opacity">
            Se connecter
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="py-10 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-black text-sm leading-none">C</span>
            </div>
            <span className="font-semibold text-gray-700">CampusHub</span>
          </div>
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} MBN Global Education. Tous droits réservés.</p>
          <div className="flex items-center gap-5 text-sm text-gray-500">
            <Link href="/jobs"     className="hover:text-gray-900 transition-colors">Offres</Link>
            <Link href="/events"   className="hover:text-gray-900 transition-colors">Événements</Link>
            <Link href="/login"    className="hover:text-gray-900 transition-colors">Connexion</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
