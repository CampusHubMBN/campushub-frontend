'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi, EventFormData } from '@/services/api/events.api';
import { CampusEvent, EventType } from '@/types/event';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Upload, X, CalendarDays, MapPin, Users, FileText, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

const EVENT_TYPES: { value: EventType; label: string; color: string }[] = [
  { value: 'general',     label: 'Général',     color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'workshop',    label: 'Atelier',     color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'conference',  label: 'Conférence',  color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { value: 'networking',  label: 'Networking',  color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'sports',      label: 'Sport',       color: 'bg-orange-100 text-orange-700 border-orange-200' },
];

const ALL_ROLES = [
  { value: 'student',     label: 'Étudiants' },
  { value: 'alumni',      label: 'Alumni' },
  { value: 'bde_member',  label: 'BDE' },
  { value: 'pedagogical', label: 'Équipe pédagogique' },
  { value: 'company',     label: 'Entreprises' },
];

// Convert ISO date to datetime-local input value
function isoToLocal(iso?: string | null): string {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 16);
}

interface Props {
  event?: CampusEvent; // if provided → edit mode
}

export function EventForm({ event }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!event;
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<EventFormData>({
    title:        event?.title        ?? '',
    description:  event?.description  ?? '',
    location:     event?.location     ?? '',
    start_date:   isoToLocal(event?.start_date),
    end_date:     isoToLocal(event?.end_date),
    capacity:     event?.capacity     ?? null,
    event_type:   event?.event_type   ?? 'general',
    target_roles: event?.target_roles ?? null,
  });

  const [publishNow, setPublishNow] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    event?.cover_image
      ? `${process.env.NEXT_PUBLIC_STORAGE_URL ?? 'http://localhost:8000'}/storage/${event.cover_image}`
      : null
  );

  const set = (field: keyof EventFormData, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleRole = (role: string) => {
    const current = form.target_roles ?? [];
    if (current.includes(role)) {
      const next = current.filter((r) => r !== role);
      set('target_roles', next.length ? next : null);
    } else {
      set('target_roles', [...current, role]);
    }
  };

  // ── Save (create or update) ───────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form };
      // Send datetime-local as-is (Laravel accepts Y-m-dTH:i format)
      // Converting to UTC ISO would cause "after:now" failures for users in UTC+ timezones
      if (!payload.capacity)  payload.capacity   = null;

      let saved: CampusEvent;
      if (isEdit) {
        saved = await eventsApi.update(event!.id, payload);
      } else {
        saved = await eventsApi.create(payload);
      }

      // Upload cover if selected
      if (coverFile) {
        await eventsApi.uploadCover(saved.id, coverFile);
      }

      // Publish immediately if requested (create mode only)
      if (!isEdit && publishNow) {
        await eventsApi.publish(saved.id);
      }

      return saved;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', saved.id] });
      toast.success(isEdit ? 'Événement mis à jour' : publishNow ? 'Événement créé et publié' : 'Événement créé (brouillon)');
      router.push(`/events/${saved.id}`);
    },
    onError: (err: any) => {
      const resp = err?.response?.data;
      // Show first validation error if available, otherwise the message, otherwise fallback
      const firstValidationError = resp?.errors
        ? Object.values(resp.errors as Record<string, string[]>).flat()[0]
        : null;
      const msg = firstValidationError
        ?? resp?.message
        ?? err?.message
        ?? (isEdit ? 'Erreur lors de la mise à jour' : 'Erreur lors de la création');
      toast.error(msg);
    },
  });

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}
      className="space-y-6"
    >
      {/* Cover image */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div
          className={cn(
            'relative h-40 flex items-center justify-center cursor-pointer group',
            coverPreview ? '' : 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-200'
          )}
          onClick={() => coverInputRef.current?.click()}
        >
          {coverPreview ? (
            <>
              <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="text-white text-sm font-medium">Changer la photo</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeCover(); }}
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <Upload className="h-8 w-8" />
              <p className="text-sm font-medium">Ajouter une photo de couverture</p>
              <p className="text-xs">JPG, PNG — max 5 Mo</p>
            </div>
          )}
        </div>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverChange}
        />
      </div>

      {/* Main fields */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Titre <span className="text-red-500">*</span>
          </label>
          <Input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Ex: Atelier CV & Lettre de motivation"
            required
            maxLength={255}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <FileText className="inline h-4 w-4 mr-1 text-gray-400" />
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Décrivez l'événement, le programme, ce que les participants vont apprendre..."
            required
            rows={5}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-campus-blue/30 resize-none"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <MapPin className="inline h-4 w-4 mr-1 text-gray-400" />
            Lieu <span className="text-red-500">*</span>
          </label>
          <Input
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="Ex: Salle 101, Bâtiment A ou En ligne (Zoom)"
            required
            maxLength={255}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <CalendarDays className="inline h-4 w-4 mr-1 text-gray-400" />
              Date et heure de début <span className="text-red-500">*</span>
            </label>
            <Input
              type="datetime-local"
              value={form.start_date}
              onChange={(e) => set('start_date', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <CalendarDays className="inline h-4 w-4 mr-1 text-gray-400" />
              Date et heure de fin <span className="text-red-500">*</span>
            </label>
            <Input
              type="datetime-local"
              value={form.end_date}
              onChange={(e) => set('end_date', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Users className="inline h-4 w-4 mr-1 text-gray-400" />
            Capacité (laisser vide = illimitée)
          </label>
          <Input
            type="number"
            min={1}
            value={form.capacity ?? ''}
            onChange={(e) => set('capacity', e.target.value ? Number(e.target.value) : null)}
            placeholder="Ex: 50"
            className="max-w-xs"
          />
        </div>
      </div>

      {/* Type */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Type d'événement</label>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => set('event_type', t.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                form.event_type === t.value
                  ? t.color + ' ring-2 ring-offset-1 ring-current'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Target roles */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Public cible
        </label>
        <p className="text-xs text-gray-400 mb-3">Laissez tout décoché = ouvert à tous</p>
        <div className="flex flex-wrap gap-2">
          {ALL_ROLES.map((r) => {
            const selected = form.target_roles?.includes(r.value) ?? false;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => toggleRole(r.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  selected
                    ? 'bg-campus-blue text-white border-campus-blue'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                )}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Publish option — create mode only */}
      {!isEdit && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <input
            type="checkbox"
            id="publish-now"
            checked={publishNow}
            onChange={(e) => setPublishNow(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-campus-blue"
          />
          <div>
            <label htmlFor="publish-now" className="text-sm font-medium text-amber-900 cursor-pointer flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              Publier immédiatement
            </label>
            <p className="text-xs text-amber-700 mt-0.5">
              L'événement sera visible par tous. Sans cette option, il sera enregistré comme brouillon.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={saveMutation.isPending}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {isEdit ? 'Enregistrer les modifications' : publishNow ? 'Créer et publier' : 'Créer le brouillon'}
        </Button>
      </div>
    </form>
  );
}
