'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useToast } from '@/components/ui/Toast';
import api from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UserIcon,
  UsersIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

const createCaseSchema = z.object({
  deceased_name: z.string().min(2, 'Full name is required'),
  cnic: z.string().min(13, 'CNIC field is required for verification'),
  age: z.string().optional(),
  gender: z.string().optional(),
  date_of_death: z.string().min(1, 'Date of death is required'),
  cause_of_death: z.string().optional(),
  next_of_kin_name: z.string().min(2, 'Next of kin name is required'),
  next_of_kin_contact: z.string().min(10, 'Contact number is required'),
  next_of_kin_relation: z.string().optional(),
});

type CreateCaseForm = z.infer<typeof createCaseSchema>;

export default function CreateDeathCasePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCaseForm>({
    resolver: zodResolver(createCaseSchema),
  });

  const onSubmit = async (data: CreateCaseForm) => {
    setIsSubmitting(true);
    try {
      await api.post('/death-cases', {
        ...data,
        age: data.age ? parseInt(data.age) : null,
      });
      showToast('Death case created successfully', 'success');
      router.push('/death-cases');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      showToast(err.response?.data?.error || 'Failed to create death case', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Header title="Death Cases" subtitle="Create" />

      <div className="p-6 lg:p-8">
        
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link href="/death-cases" className="text-gray-500 hover:text-gray-700">
            Death Cases
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">Create</span>
        </div>

        
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create Death Case Request</h2>
            <p className="text-gray-500 mt-1">
              Official registration of deceased records and next of kin information.
            </p>
          </div>
          <span className="badge badge-pending">Pending</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <UserIcon className="w-5 h-5 text-[#2D6A4F]" />
              <h3 className="font-semibold text-gray-900">Deceased Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Full Name *</label>
                <input
                  {...register('deceased_name')}
                  type="text"
                  className={`input-field ${errors.deceased_name ? 'input-error' : ''}`}
                  placeholder="Enter full name"
                />
                {errors.deceased_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.deceased_name.message}</p>
                )}
              </div>
              <div>
                <label className="label">CNIC Number *</label>
                <input
                  {...register('cnic')}
                  type="text"
                  className={`input-field ${errors.cnic ? 'input-error' : ''}`}
                  placeholder="XXXXX-XXXXXXX-X"
                />
                {errors.cnic && (
                  <p className="text-red-500 text-xs mt-1">{errors.cnic.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="label">Age</label>
                <input
                  {...register('age')}
                  type="number"
                  className="input-field"
                  placeholder="Age"
                />
              </div>
              <div>
                <label className="label">Gender</label>
                <select {...register('gender')} className="input-field">
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="label">Date of Death *</label>
                <input
                  {...register('date_of_death')}
                  type="date"
                  className={`input-field ${errors.date_of_death ? 'input-error' : ''}`}
                />
                {errors.date_of_death && (
                  <p className="text-red-500 text-xs mt-1">{errors.date_of_death.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="label">Cause of Death</label>
              <textarea
                {...register('cause_of_death')}
                rows={3}
                className="input-field resize-none"
                placeholder="Provide detailed medical cause of death or incident details"
              />
            </div>
          </div>

          
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <UsersIcon className="w-5 h-5 text-[#2D6A4F]" />
              <h3 className="font-semibold text-gray-900">Next of Kin (Primary Contact)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Full Name *</label>
                <input
                  {...register('next_of_kin_name')}
                  type="text"
                  className={`input-field ${errors.next_of_kin_name ? 'input-error' : ''}`}
                  placeholder="Enter full name"
                />
                {errors.next_of_kin_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.next_of_kin_name.message}</p>
                )}
              </div>
              <div>
                <label className="label">Contact Number *</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg text-gray-500 text-sm">
                    +92
                  </span>
                  <input
                    {...register('next_of_kin_contact')}
                    type="tel"
                    className={`input-field rounded-l-none ${
                      errors.next_of_kin_contact ? 'input-error' : ''
                    }`}
                    placeholder="3XX-XXXXXXX"
                  />
                </div>
                {errors.next_of_kin_contact && (
                  <p className="text-red-500 text-xs mt-1">{errors.next_of_kin_contact.message}</p>
                )}
              </div>
              <div>
                <label className="label">Relationship to Deceased</label>
                <select {...register('next_of_kin_relation')} className="input-field">
                  <option value="">Select relationship</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <InformationCircleIcon className="w-4 h-4" />
              <span>Submitting this form will mark the case as &apos;Pending&apos; for verification.</span>
            </div>
            <div className="flex gap-3">
              <Link href="/death-cases" className="btn-secondary">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
