'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ArrowLeftIcon, PhoneIcon, CheckBadgeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Reservation {
  reservation_id: number;
  reservation_number: string;
  grave_id: number;
  plot_id: string;
  section_name: string;
  cemetery_name: string;
}

interface Grave {
  grave_id: number;
  plot_id: string;
  status: string;
  section_id: number;
}

export default function RequestAdjacentPlotPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [sectionGraves, setSectionGraves] = useState<Grave[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [selectedAdjacentGrave, setSelectedAdjacentGrave] = useState<Grave | null>(null);

  const [formData, setFormData] = useState({
    relationship: '',
    service_type: '',
    notes: '',
  });

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const res = await api.get('/reservations');
      const activeReservations = (res.data.reservations || []).filter(
        (r: any) => r.status === 'approved' || r.status === 'pending'
      );
      setReservations(activeReservations);
    } catch (err) {
      console.error('Failed to fetch reservations:', err);
    }
  };

  const handleReservationSelect = async (reservationId: string) => {
    const reservation = reservations.find(r => r.reservation_id === parseInt(reservationId));
    setSelectedReservation(reservation || null);
    setSelectedAdjacentGrave(null);

    if (reservation) {
      try {
        const graveRes = await api.get(`/graves/${reservation.grave_id}`);
        const sectionId = graveRes.data.grave.section_id;
        const sectionRes = await api.get(`/graves/section/${sectionId}`);
        setSectionGraves(sectionRes.data.graves || []);
      } catch (err) {
        console.error('Failed to fetch section graves:', err);
      }
    }
  };

  const isAdjacent = (plotId1: string, plotId2: string) => {
    const num1 = parseInt(plotId1.replace(/\D/g, '')) || 0;
    const num2 = parseInt(plotId2.replace(/\D/g, '')) || 0;
    return Math.abs(num1 - num2) === 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReservation || !selectedAdjacentGrave) {
      setToast('Please select your existing plot and an adjacent plot');
      setTimeout(() => setToast(''), 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/reservations/adjacent-plot', {
        existing_reservation_id: selectedReservation.reservation_id,
        requested_grave_id: selectedAdjacentGrave.grave_id,
        relationship: formData.relationship,
        service_type: formData.service_type,
        notes: formData.notes,
      });
      setToast('Adjacent plot request submitted successfully!');
      setTimeout(() => {
        router.push('/reservations');
      }, 2000);
    } catch (err: any) {
      console.error('Failed to submit request:', err);
      setToast(err.response?.data?.error || 'Failed to submit request');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    setToast('Draft saved');
    setTimeout(() => setToast(''), 2000);
  };

  return (
    <div>
      <Header title="Plot Extension Request" />

      <div className="p-6 lg:p-8">
        {toast && (
          <div className={`fixed top-20 right-6 px-4 py-3 rounded-lg shadow-lg z-50 ${
            toast.includes('success') || toast === 'Draft saved' ? 'bg-[#2D6A4F] text-white' : 'bg-red-500 text-white'
          }`}>
            {toast}
          </div>
        )}

        <Link
          href="/grave-plots"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Grave Plots
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Plot Extension Request</h1>
          <p className="text-gray-500 mt-1">
            Request an adjacent plot next to your existing reservation.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Select Your Existing Plot</h3>
              <select
                value={selectedReservation?.reservation_id || ''}
                onChange={(e) => handleReservationSelect(e.target.value)}
                className="input-field"
              >
                <option value="">Select your reserved plot</option>
                {reservations.map((res) => (
                  <option key={res.reservation_id} value={res.reservation_id}>
                    {res.plot_id} - {res.section_name} ({res.cemetery_name})
                  </option>
                ))}
              </select>

              {reservations.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  You don't have any active reservations. Please reserve a plot first.
                </p>
              )}
            </div>

            {selectedReservation && sectionGraves.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-4">Select Adjacent Plot</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Click on an available adjacent plot (highlighted in green) to select it.
                </p>

                <div className="grid grid-cols-6 gap-2 mb-4">
                  {sectionGraves.map((grave) => {
                    const isCurrentPlot = grave.grave_id === selectedReservation.grave_id;
                    const isAdjacentAvailable = grave.status === 'available' && isAdjacent(grave.plot_id, selectedReservation.plot_id);
                    const isSelected = selectedAdjacentGrave?.grave_id === grave.grave_id;

                    return (
                      <button
                        key={grave.grave_id}
                        type="button"
                        onClick={() => isAdjacentAvailable && setSelectedAdjacentGrave(grave)}
                        disabled={!isAdjacentAvailable && !isCurrentPlot}
                        className={`p-2 rounded text-xs font-medium transition-all ${
                          isCurrentPlot
                            ? 'bg-[#1B3A2D] text-white'
                            : isSelected
                            ? 'bg-[#2D6A4F] text-white ring-2 ring-[#2D6A4F] ring-offset-2'
                            : isAdjacentAvailable
                            ? 'bg-green-100 border-2 border-green-500 text-green-700 cursor-pointer hover:bg-green-200'
                            : grave.status === 'available'
                            ? 'bg-gray-100 text-gray-400'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        {grave.plot_id}
                      </button>
                    );
                  })}
                </div>

                {selectedAdjacentGrave && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <CheckBadgeIcon className="w-5 h-5 text-green-600" />
                    <span className="text-green-700 font-medium">
                      Adjacency Validated - Plot {selectedAdjacentGrave.plot_id}
                    </span>
                  </div>
                )}
              </div>
            )}

            {selectedAdjacentGrave && (
              <form onSubmit={handleSubmit} className="card">
                <h3 className="font-semibold text-gray-900 mb-4">Request Documentation</h3>

                <div className="space-y-4">
                  <div>
                    <label className="label">Relationship to Existing Resident</label>
                    <select
                      value={formData.relationship}
                      onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select relationship</option>
                      <option value="spouse">Spouse</option>
                      <option value="child">Child</option>
                      <option value="parent">Parent</option>
                      <option value="sibling">Sibling</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Planned Service Type</label>
                    <select
                      value={formData.service_type}
                      onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select service type</option>
                      <option value="standard_burial">Standard Burial</option>
                      <option value="cremation">Cremation</option>
                      <option value="mausoleum">Mausoleum</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Additional Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="input-field"
                      rows={3}
                      placeholder="Any additional information..."
                    />
                  </div>
                </div>
              </form>
            )}
          </div>

          <div className="space-y-4">
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Reservation Summary</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Primary Plot</dt>
                  <dd className="font-medium">{selectedReservation?.plot_id || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Requested Plot</dt>
                  <dd className="font-medium">{selectedAdjacentGrave?.plot_id || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Section</dt>
                  <dd className="font-medium">{selectedReservation?.section_name || '-'}</dd>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <dt className="text-gray-500">Estimated Cost</dt>
                  <dd className="font-bold text-[#2D6A4F]">PKR 25,000</dd>
                </div>
              </dl>
            </div>

            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">
                  Adjacent requests are subject to verification. Approval typically takes 2-3 business days.
                </p>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!selectedAdjacentGrave || isSubmitting}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              className="btn-secondary w-full"
            >
              Save as Draft
            </button>

            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Need Assistance?</h3>
              <p className="text-sm text-gray-500 mb-3">
                Our team can help you find the best options.
              </p>
              <button className="btn-secondary w-full">
                <PhoneIcon className="w-4 h-4" />
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
