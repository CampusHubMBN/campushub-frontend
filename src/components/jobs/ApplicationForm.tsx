// src/components/jobs/ApplicationForm.tsx
'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApplicationFormData } from '@/types/job-application';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FileText,
  Upload,
  Link,
  Calendar,
  Euro,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  CheckCircle2,
  Paperclip,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Validation ───────────────────────────────────────────────────────────────
const applicationSchema = z.object({
  cover_letter: z
    .string()
    .min(100, 'La lettre de motivation doit faire au moins 100 caractères')
    .max(3000, 'Maximum 3 000 caractères'),
  // Champs extra — à activer si ton JobApplicationController les accepte
  portfolio_url:      z.string().url('URL invalide').optional().or(z.literal('')),
  availability_date:  z.string().optional(),
  salary_expectation: z.coerce.number().min(0).optional().or(z.literal('')),
  additional_info:    z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof applicationSchema>;

interface ApplicationFormProps {
  onSubmit: (data: ApplicationFormData) => Promise<void>;
  defaultCvUrl?: string | null;  // cv_url du profil (info seulement)
  loading?: boolean;
}

const COVER_LETTER_TEMPLATE = `Madame, Monsieur,

Actuellement étudiant(e) en [formation], je suis vivement intéressé(e) par le poste de [intitulé du poste] au sein de votre organisation.

[Développez ici vos motivations et compétences en lien avec l'offre...]

Disponible à partir du [date], je serais ravi(e) de vous rencontrer pour un entretien.

Cordialement,
[Votre prénom et nom]`;

export function ApplicationForm({
  onSubmit,
  defaultCvUrl,
  loading = false,
}: ApplicationFormProps) {
  const [showAdvanced, setShowAdvanced]  = useState(false);
  // ✅ cv: File — champ attendu par l'API (FormData → cv_url après upload)
  const [cvFile, setCvFile]              = useState<File | null>(null);
  // ✅ additional_documents: File[] — casté en array JSON côté Laravel
  const [additionalDocs, setAdditionalDocs] = useState<File[]>([]);
  const [charCount, setCharCount]        = useState(0);
  const cvInputRef                       = useRef<HTMLInputElement>(null);
  const docsInputRef                     = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(applicationSchema),
    mode: 'onChange',
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { alert('Seuls les fichiers PDF sont acceptés'); return; }
    if (file.size > 5 * 1024 * 1024)    { alert('Le fichier ne doit pas dépasser 5 Mo'); return; }
    setCvFile(file);
  };

  const handleDocsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter((f) => f.size <= 5 * 1024 * 1024);
    if (valid.length < files.length) alert('Certains fichiers dépassent 5 Mo et ont été ignorés');
    setAdditionalDocs((prev) => [...prev, ...valid].slice(0, 5));
  };

  const removeDoc = (index: number) =>
    setAdditionalDocs((prev) => prev.filter((_, i) => i !== index));

  const handleFormSubmit = async (values: FormValues) => {
    const data: ApplicationFormData = {
      cover_letter: values.cover_letter,
      // Champs extra — supprime si ton controller ne les gère pas
      portfolio_url:      values.portfolio_url      || undefined,
      availability_date:  values.availability_date  || undefined,
      salary_expectation: values.salary_expectation
        ? Number(values.salary_expectation)
        : undefined,
      additional_info: values.additional_info || undefined,
    };

    if (cvFile)                  data.cv = cvFile;
    if (additionalDocs.length > 0) data.additional_documents = additionalDocs;

    await onSubmit(data);
  };

  const useTemplate = () => {
    setValue('cover_letter', COVER_LETTER_TEMPLATE, { shouldValidate: true });
    setCharCount(COVER_LETTER_TEMPLATE.length);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">

      {/* ── 1. Lettre de motivation ── */}
      <Card className="border-campus-gray-300 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-campus-gray-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-campus-blue" />
              Lettre de motivation
              <span className="text-red-500 ml-0.5">*</span>
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={useTemplate}
              className="text-xs text-campus-blue hover:text-campus-blue-700 hover:bg-campus-blue-50"
            >
              Utiliser un modèle
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          <Textarea
            {...register('cover_letter', {
              onChange: (e) => setCharCount(e.target.value.length),
            })}
            placeholder="Rédigez votre lettre de motivation..."
            rows={12}
            className={cn(
              'resize-none font-mono text-sm leading-relaxed',
              'border-campus-gray-300 focus-visible:ring-campus-blue',
              errors.cover_letter && 'border-red-400 focus-visible:ring-red-300'
            )}
          />
          <div className="flex items-center justify-between text-xs">
            <span className={cn(
              charCount < 100 ? 'text-red-500' : 'text-campus-blue-600 font-medium'
            )}>
              {charCount < 100
                ? `Encore ${100 - charCount} caractères minimum`
                : `✓ ${charCount} caractères`}
            </span>
            <span className="text-campus-gray-500">{charCount} / 3 000</span>
          </div>
          {errors.cover_letter && (
            <p className="text-xs text-red-500">{errors.cover_letter.message}</p>
          )}
        </CardContent>
      </Card>

      {/* ── 2. CV ── */}
      <Card className="border-campus-gray-300 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-campus-gray-900 flex items-center gap-2">
            <Upload className="h-4 w-4 text-campus-blue" />
            CV (PDF)
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {cvFile ? (
            <div className="flex items-center gap-3 p-3 bg-campus-blue-50 rounded-lg border border-campus-blue-100">
              <CheckCircle2 className="h-5 w-5 text-campus-blue flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-campus-blue-800 truncate">{cvFile.name}</p>
                <p className="text-xs text-campus-blue-500">
                  {(cvFile.size / 1024 / 1024).toFixed(2)} Mo
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCvFile(null);
                  if (cvInputRef.current) cvInputRef.current.value = '';
                }}
                className="text-campus-gray-400 hover:text-campus-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => cvInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                'border-campus-gray-300 hover:border-campus-blue hover:bg-campus-blue-50'
              )}
            >
              <Upload className="h-8 w-8 text-campus-gray-400 mx-auto mb-2" />
              <p className="text-sm text-campus-gray-600 mb-1">
                Cliquez ou glissez votre CV ici
              </p>
              <p className="text-xs text-campus-gray-400">PDF uniquement · Max 5 Mo</p>
            </div>
          )}

          {/* Info CV profil existant */}
          {!cvFile && defaultCvUrl && (
            <p className="text-xs text-campus-gray-500 flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-campus-blue-400" />
              Votre CV de profil sera utilisé si vous n'en uploadez pas un nouveau
            </p>
          )}

          <input
            ref={cvInputRef}
            type="file"
            accept=".pdf"
            onChange={handleCvChange}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* ── 3. Infos complémentaires ── */}
      <Card className="border-campus-gray-300 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            'w-full px-6 py-4 flex items-center justify-between text-left',
            'hover:bg-campus-gray-50 transition-colors',
            showAdvanced && 'border-b border-campus-gray-200'
          )}
        >
          <span className="text-sm font-semibold text-campus-gray-800">
            Informations complémentaires
          </span>
          {showAdvanced
            ? <ChevronUp   className="h-4 w-4 text-campus-gray-500" />
            : <ChevronDown className="h-4 w-4 text-campus-gray-500" />
          }
        </button>

        {showAdvanced && (
          <CardContent className="pt-5 space-y-4">

            {/* Documents additionnels → additional_documents[] dans le modèle */}
            <div className="space-y-2">
              <Label className="text-sm text-campus-gray-700">
                Documents supplémentaires
                <span className="text-campus-gray-400 font-normal ml-1">(max 5)</span>
              </Label>
              {additionalDocs.length > 0 && (
                <ul className="space-y-1.5">
                  {additionalDocs.map((doc, i) => (
                    <li key={i} className="flex items-center gap-2 p-2 bg-campus-gray-50 rounded border border-campus-gray-200">
                      <Paperclip className="h-3.5 w-3.5 text-campus-gray-400 flex-shrink-0" />
                      <span className="text-xs text-campus-gray-700 flex-1 truncate">{doc.name}</span>
                      <button
                        type="button"
                        onClick={() => removeDoc(i)}
                        className="text-campus-gray-400 hover:text-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {additionalDocs.length < 5 && (
                <button
                  type="button"
                  onClick={() => docsInputRef.current?.click()}
                  className="text-xs text-campus-blue hover:text-campus-blue-700 flex items-center gap-1.5"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  Ajouter un document
                </button>
              )}
              <input
                ref={docsInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                multiple
                onChange={handleDocsChange}
                className="hidden"
              />
            </div>

            {/* Portfolio — hors modèle, à activer si le controller l'accepte */}
            <div className="space-y-1.5">
              <Label className="text-sm text-campus-gray-700">Portfolio / GitHub</Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-campus-gray-400" />
                <Input
                  {...register('portfolio_url')}
                  placeholder="https://monportfolio.com"
                  className="pl-10 border-campus-gray-300 focus-visible:ring-campus-blue"
                />
              </div>
              {errors.portfolio_url && (
                <p className="text-xs text-red-500">{errors.portfolio_url.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm text-campus-gray-700">Disponibilité</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-campus-gray-400" />
                  <Input
                    type="date"
                    {...register('availability_date')}
                    className="pl-10 border-campus-gray-300 focus-visible:ring-campus-blue"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-campus-gray-700">
                  Prétentions salariales
                  <span className="text-campus-gray-400 font-normal ml-1">(€/mois)</span>
                </Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-campus-gray-400" />
                  <Input
                    type="number"
                    {...register('salary_expectation')}
                    placeholder="1 800"
                    className="pl-10 border-campus-gray-300 focus-visible:ring-campus-blue"
                    min={0}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-campus-gray-700">Message complémentaire</Label>
              <Textarea
                {...register('additional_info')}
                placeholder="Questions, informations supplémentaires..."
                rows={3}
                className="resize-none border-campus-gray-300 focus-visible:ring-campus-blue"
              />
              {errors.additional_info && (
                <p className="text-xs text-red-500">{errors.additional_info.message}</p>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        disabled={loading || !isValid}
        className={cn(
          'w-full font-semibold transition-all',
          'bg-campus-blue hover:bg-campus-blue-600 text-white',
          'disabled:bg-campus-gray-300 disabled:text-campus-gray-500 disabled:cursor-not-allowed'
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Envoi en cours…
          </>
        ) : (
          'Envoyer ma candidature'
        )}
      </Button>
    </form>
  );
}
