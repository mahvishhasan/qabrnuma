'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import api from '@/lib/api';
import { Grave } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ClockIcon,
  CurrencyDollarIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const reserveSchema = z.object({
  primary_contact: z.string().min(2, 'Contact name is required'),
  phone_number: z.string().min(10, 'Phone number is required'),
  email: z.string().email('Valid email is required'),
  reservation_purpose: z.string().min(1, 'Purpose is required'),
  agree_terms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms',
  }),
});

type ReserveForm = z.infer<typeof reserveSchema>;

export default function ReservePlotPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [grave, setGrave] = useState<Grave | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReserveForm>({
    resolver: zodResolver(reserveSchema),
    defaultValues: {
      reservation_purpose: 'Immediate Need',
    },
  });

  useEffect(() => {
    fetchGrave();
  }, [params.id]);

  const fetchGrave = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/graves/${params.id}`);
      setGrave(res.data.grave);
    } catch (error) {
      console.error('Failed to fetch grave:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ReserveForm) => {
    setIsSubmitting(true);
    try {
      await api.post('/reservations', {
        grave_id: params.id,
        primary_contact: data.primary_contact,
        phone_number: data.phone_number,
        email: data.email,
        reservation_purpose: data.reservation_purpose,
        holding_fee: 250,
      });
      showToast('Plot reserved successfully', 'success');
      router.push('/reservations');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      showToast(err.response?.data?.error || 'Failed to reserve plot', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Reserve Plot" />
        <div className="p-6 lg:p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-64 bg-gray-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!grave || grave.status !== 'available') {
    return (
      <div>
        <Header title="Reserve Plot" />
        <div className="p-6 lg:p-8">
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">This plot is not available for reservation.</p>
            <Link href="/grave-plots" className="btn-primary">
              Back to Plots
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Cemetery Management" />

      <div className="p-6 lg:p-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link href="/grave-plots" className="text-gray-500 hover:text-gray-700">
            Back to Map
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">Reserve Plot</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Plot Info */}
          <div className="space-y-6">
            {/* Selected Plot Card */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Selected Plot</h3>
              <div className="h-40 bg-gradient-to-br from-[#2D6A4F]/20 to-[#1B3A2D]/20 rounded-lg mb-4 relative">
                <StatusBadge status="available" className="absolute top-3 right-3" />
              </div>
              <div className="space-y-2">
                <p className="font-bold text-gray-900">{grave.plot_id}</p>
                <p className="text-sm text-gray-500">
                  Section: {grave.section_name} ({grave.section_code})
                </p>
                <p className="text-sm text-gray-500 capitalize">Type: {grave.plot_type}</p>
              </div>
            </div>

            {/* Hold Duration Card */}
            <div className="bg-[#1B3A2D] rounded-xl p-5 text-white">
              <div className="flex items-center gap-3">
                <ClockIcon className="w-8 h-8 text-[#52b788]" />
                <div>
                  <p className="text-sm text-white/60">Hold Duration</p>
                  <p className="text-xl font-bold">48 hours</p>
                </div>
              </div>
              <p className="text-sm text-white/60 mt-3">
                Your reservation will be held for 48 hours pending administrative approval.
                Please ensure all required documents are submitted within this period.
              </p>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-1">Plot Reservation Form</h3>
            <p className="text-sm text-gray-500 mb-6">
              Complete the form below to reserve this burial plot.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Primary Contact Name *</label>
                  <input
                    {...register('primary_contact')}
                    type="text"
                    className={`input-field ${errors.primary_contact ? 'input-error' : ''}`}
                    placeholder="Full name"
                  />
                  {errors.primary_contact && (
                    <p className="text-red-500 text-xs mt-1">{errors.primary_contact.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Phone Number *</label>
                  <input
                    {...register('phone_number')}
                    type="tel"
                    className={`input-field ${errors.phone_number ? 'input-error' : ''}`}
                    placeholder="+92 3XX-XXXXXXX"
                  />
                  {errors.phone_number && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone_number.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="label">Email Address *</label>
                <input
                  {...register('email')}
                  type="email"
                  className={`input-field ${errors.email ? 'input-error' : ''}`}
                  placeholder="email@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="label">Reservation Purpose *</label>
                <select
                  {...register('reservation_purpose')}
                  className={`input-field ${errors.reservation_purpose ? 'input-error' : ''}`}
                >
                  <option value="Immediate Need">Immediate Need</option>
                  <option value="Pre-Planning">Pre-Planning</option>
                  <option value="Family Reserve">Family Reserve</option>
                </select>
              </div>

              {/* Fee Info Box */}
              <div className="bg-[#D1FAE5] rounded-lg p-4 flex items-start gap-3">
                <CurrencyDollarIcon className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Initial Holding Fee: Rs. 250.00</p>
                  <p className="text-sm text-green-700 mt-1">
                    This fee is refundable if the reservation is cancelled within 24 hours.
                  </p>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3">
                <input
                  {...register('agree_terms')}
                  type="checkbox"
                  id="agree_terms"
                  className="mt-1 w-4 h-4 text-[#2D6A4F] border-gray-300 rounded focus:ring-[#2D6A4F]"
                />
                <label htmlFor="agree_terms" className="text-sm text-gray-600">
                  I agree to the{' '}
                  <span className="text-[#2D6A4F] hover:underline cursor-pointer">
                    Reservation Terms & Conditions
                  </span>
                </label>
              </div>
              {errors.agree_terms && (
                <p className="text-red-500 text-xs">{errors.agree_terms.message}</p>
              )}

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm & Reserve'}
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
