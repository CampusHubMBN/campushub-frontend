// src/hooks/useJobs.ts
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { jobsApi } from '@/services/api/jobs.api';
// import { toast } from 'sonner';

// export function useJobs() {
//   return useQuery({
//     queryKey: ['jobs'],
//     queryFn: () => jobsApi.getAll(),
//   });
// }

// export function useJob(id: string) {
//   return useQuery({
//     queryKey: ['jobs', id],
//     queryFn: () => jobsApi.getById(id),
//     enabled: !!id,
//   });
// }

// export function useCreateJob() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: jobsApi.create,
//     onSuccess: () => {
//       // ✅ Invalider cache pour refetch
//       queryClient.invalidateQueries({ queryKey: ['jobs'] });
//       toast.success('Offre créée !');
//     },
//     onError: (error: any) => {
//       toast.error(error.response?.data?.message || 'Erreur');
//     },
//   });
// }

// export function useApplyToJob() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({ jobId, data }: any) => jobsApi.apply(jobId, data),
//     onSuccess: (_, variables) => {
//       queryClient.invalidateQueries({ queryKey: ['jobs', variables.jobId] });
//       toast.success('Candidature envoyée !');
//     },
//   });
// }