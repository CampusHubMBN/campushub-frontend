// src/components/jobs/ApplicationForm.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { ApplicationFormData } from '@/types/job-application';

interface ApplicationFormProps {
  onSubmit: (data: ApplicationFormData) => Promise<void>;
  defaultCvUrl?: string | null;
  loading?: boolean;
}

export function ApplicationForm({
  onSubmit,
  defaultCvUrl,
  loading = false,
}: ApplicationFormProps) {
  const [coverLetter, setCoverLetter] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!coverLetter.trim()) {
      newErrors.cover_letter = 'La lettre de motivation est requise';
    } else if (coverLetter.length < 50) {
      newErrors.cover_letter = 'Minimum 50 caractères requis';
    } else if (coverLetter.length > 5000) {
      newErrors.cover_letter = 'Maximum 5000 caractères';
    }

    // CV is required if user doesn't have one in profile
    if (!defaultCvUrl && !cvFile) {
      newErrors.cv = 'Veuillez uploader votre CV';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setErrors({ ...errors, cv: 'Format accepté : PDF, DOC, DOCX' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, cv: 'Le fichier doit faire moins de 5MB' });
      return;
    }

    setCvFile(file);
    setErrors({ ...errors, cv: '' });
  };

  const handleAdditionalFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    const invalidFiles = files.filter(f => !validTypes.includes(f.type) || f.size > 5 * 1024 * 1024);

    if (invalidFiles.length > 0) {
      setErrors({
        ...errors,
        additional: 'Formats acceptés : PDF, DOC, DOCX, JPG, PNG (max 5MB chacun)'
      });
      return;
    }

    setAdditionalFiles([...additionalFiles, ...files]);
    setErrors({ ...errors, additional: '' });
  };

  const removeAdditionalFile = (index: number) => {
    setAdditionalFiles(additionalFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const formData: ApplicationFormData = {
      cover_letter: coverLetter,
    };

    if (cvFile) {
      formData.cv = cvFile;
    }

    if (additionalFiles.length > 0) {
      formData.additional_documents = additionalFiles;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cover Letter */}
      <Card>
        <CardHeader>
          <CardTitle>Lettre de motivation *</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={coverLetter}
            onChange={(e) => {
              setCoverLetter(e.target.value);
              setErrors({ ...errors, cover_letter: '' });
            }}
            placeholder="Expliquez pourquoi vous êtes le candidat idéal pour ce poste...&#10;&#10;Conseils :&#10;- Présentez-vous brièvement&#10;- Expliquez votre motivation pour le poste&#10;- Mettez en avant vos compétences pertinentes&#10;- Montrez votre connaissance de l'entreprise"
            rows={12}
            className={errors.cover_letter ? 'border-red-500' : ''}
          />
          <div className="flex items-center justify-between mt-2">
            <p className={`text-sm ${
              coverLetter.length < 50
                ? 'text-red-500'
                : coverLetter.length > 5000
                ? 'text-red-500'
                : 'text-gray-500'
            }`}>
              {coverLetter.length} / 5000 caractères (minimum 50)
            </p>
          </div>
          {errors.cover_letter && (
            <p className="text-sm text-red-500 mt-1">{errors.cover_letter}</p>
          )}
        </CardContent>
      </Card>

      {/* CV Upload */}
      <Card>
        <CardHeader>
          <CardTitle>
            Curriculum Vitae {!defaultCvUrl && '*'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {defaultCvUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-700">
                ✓ Votre CV de profil sera utilisé par défaut
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Vous pouvez uploader un CV différent ci-dessous
              </p>
            </div>
          )}

          {cvFile ? (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
              <FileText className="h-5 w-5 text-gray-500" />
              <span className="flex-1 text-sm truncate">{cvFile.name}</span>
              <span className="text-xs text-gray-500">
                {(cvFile.size / 1024).toFixed(0)} KB
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCvFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed rounded cursor-pointer hover:bg-gray-50 transition-colors">
              <Upload className="h-8 w-8 text-gray-400" />
              <span className="text-sm text-gray-600 font-medium">
                Cliquer pour uploader un CV
              </span>
              <span className="text-xs text-gray-500">
                PDF, DOC, DOCX (max 5MB)
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleCvChange}
              />
            </label>
          )}
          {errors.cv && (
            <p className="text-sm text-red-500">{errors.cv}</p>
          )}
        </CardContent>
      </Card>

      {/* Additional Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documents complémentaires (optionnel)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            Lettres de recommandation, certifications, portfolio, etc.
          </p>

          {additionalFiles.length > 0 && (
            <div className="space-y-2">
              {additionalFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded border"
                >
                  <FileText className="h-5 w-5 text-gray-500" />
                  <span className="flex-1 text-sm truncate">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAdditionalFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded cursor-pointer hover:bg-gray-50 transition-colors">
            <Upload className="h-6 w-6 text-gray-400" />
            <span className="text-sm text-gray-600">
              Ajouter des documents
            </span>
            <span className="text-xs text-gray-500">
              PDF, DOC, DOCX, JPG, PNG (max 5MB chacun)
            </span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              multiple
              className="hidden"
              onChange={handleAdditionalFilesChange}
            />
          </label>
          {errors.additional && (
            <p className="text-sm text-red-500">{errors.additional}</p>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            'Envoyer ma candidature'
          )}
        </Button>
      </div>
    </form>
  );
}
