'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ArrowLeftIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface DeathCase {
  case_id: number;
  registration_number: string;
  deceased_name: string;
}

interface Grave {
  grave_id: number;
  plot_id: string;
  section_name: string;
  cemetery_name: string;
  status: string;
}

interface NextOfKin {
  name: string;
  relationship: string;
  phone: string;
}

export default function CreateBurialRecordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const caseIdFromUrl = searchParams.get('caseId');

  const [deathCases, setDeathCases] = useState<DeathCase[]>([]);
  const [graves, setGraves] = useState<Grave[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    case_id: caseIdFromUrl || '',
    grave_id: '',
    funeral_director: '',
    burial_type: '',
    date_of_service: '',
    officiating_clergy: '',
    religious_affiliation: '',
    vault_type: '',
    memorial_type: '',
    plot_ownership: '',
    remarks: '',
  });

  const [nextOfKin, setNextOfKin] = useState<NextOfKin[]>([
    { name: '', relationship: '', phone: '' }
  ]);

  const canCreate = user?.role === 'admin' || user?.role === 'funeral_coordinator';

  useEffect(() => {
    if (!canCreate) {
      router.push('/burial-records');
      return;
    }
    fetchDeathCases();
    fetchGraves();
  }, [canCreate]);

  const fetchDeathCases = async () => {
    try {
      const res = await api.get('/death-cases?limit=100');
      setDeathCases(res.data.cases || []);
    } catch (err) {
      console.error('Failed to fetch death cases:', err);
    }
  };

  const fetchGraves = async () => {
    try {
      const res = await api.get('/graves?limit=100');
      setGraves(res.data.graves || []);
    } catch (err) {
      console.error('Failed to fetch graves:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextOfKinChange = (index: number, field: keyof NextOfKin, value: string) => {
    const updated = [...nextOfKin];
    updated[index][field] = value;
    setNextOfKin(updated);
  };

  const addNextOfKin = () => {
    if (nextOfKin.length < 3) {
      setNextOfKin([...nextOfKin, { name: '', relationship: '', phone: '' }]);
    }
  };

  const removeNextOfKin = (index: number) => {
    if (nextOfKin.length > 1) {
      setNextOfKin(nextOfKin.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.case_id || !formData.grave_id) {
      setError('Case Reference and Grave Plot are required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        ...formData,
        case_id: parseInt(formData.case_id),
        grave_id: parseInt(formData.grave_id),
        next_of_kin: nextOfKin.filter(k => k.name),
      };

      const res = await api.post('/burial-records', payload);
      router.push(`/burial-records/${res.data.burial_record.record_id}`);
    } catch (err: any) {
      console.error('Failed to create burial record:', err);
      setError(err.response?.data?.error || 'Failed to create burial record');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canCreate) return null;

  return (
    <div>
      <Header title="Create Burial Record" />

      <div className="p-6 lg:p-8">
        <Link
          href="/burial-records"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Burial Records
        </Link>

        <div className="card max-w-4xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Create Burial Record</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Case Reference *</label>
                <select
                  name="case_id"
                  value={formData.case_id}
                  onChange={handleChange}
                  className="input-field"
                  required
                  disabled={!!caseIdFromUrl}
                >
                  <option value="">Select a case</option>
                  {deathCases.map((dc) => (
                    <option key={dc.case_id} value={dc.case_id}>
                      {dc.registration_number} - {dc.deceased_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Grave Plot *</label>
                <select
                  name="grave_id"
                  value={formData.grave_id}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">Select a grave plot</option>
                  {graves.map((g) => (
                    <option key={g.grave_id} value={g.grave_id}>
                      {g.plot_id} - {g.section_name} ({g.cemetery_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Funeral Director</label>
                <input
                  type="text"
                  name="funeral_director"
                  value={formData.funeral_director}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Name of funeral director"
                />
              </div>

              <div>
                <label className="label">Burial Type</label>
                <select
                  name="burial_type"
                  value={formData.burial_type}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select burial type</option>
                  <option value="in_ground_casket">In-ground Casket</option>
                  <option value="cremation">Cremation</option>
                  <option value="mausoleum">Mausoleum</option>
                  <option value="green_burial">Green Burial</option>
                </select>
              </div>

              <div>
                <label className="label">Date of Service</label>
                <input
                  type="datetime-local"
                  name="date_of_service"
                  value={formData.date_of_service}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Officiating Clergy</label>
                <input
                  type="text"
                  name="officiating_clergy"
                  value={formData.officiating_clergy}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Name of officiating clergy"
                />
              </div>

              <div>
                <label className="label">Religious Affiliation</label>
                <input
                  type="text"
                  name="religious_affiliation"
                  value={formData.religious_affiliation}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Islam, Christianity"
                />
              </div>

              <div>
                <label className="label">Vault Type</label>
                <input
                  type="text"
                  name="vault_type"
                  value={formData.vault_type}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Type of vault if applicable"
                />
              </div>

              <div>
                <label className="label">Memorial Type</label>
                <select
                  name="memorial_type"
                  value={formData.memorial_type}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select memorial type</option>
                  <option value="flat_granite">Flat Granite</option>
                  <option value="upright_headstone">Upright Headstone</option>
                  <option value="bronze_marker">Bronze Marker</option>
                  <option value="none">None</option>
                </select>
              </div>

              <div>
                <label className="label">Plot Ownership</label>
                <input
                  type="text"
                  name="plot_ownership"
                  value={formData.plot_ownership}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Owner name or reference"
                />
              </div>
            </div>

            <div>
              <label className="label">Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                className="input-field"
                rows={3}
                placeholder="Additional notes or remarks..."
              />
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Next of Kin</h3>
                {nextOfKin.length < 3 && (
                  <button type="button" onClick={addNextOfKin} className="btn-secondary text-sm">
                    <PlusIcon className="w-4 h-4" />
                    Add Next of Kin
                  </button>
                )}
              </div>

              {nextOfKin.map((kin, index) => (
                <div key={index} className="grid gap-4 md:grid-cols-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="label">Name</label>
                    <input
                      type="text"
                      value={kin.name}
                      onChange={(e) => handleNextOfKinChange(index, 'name', e.target.value)}
                      className="input-field"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="label">Relationship</label>
                    <input
                      type="text"
                      value={kin.relationship}
                      onChange={(e) => handleNextOfKinChange(index, 'relationship', e.target.value)}
                      className="input-field"
                      placeholder="e.g., Spouse, Child"
                    />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input
                      type="tel"
                      value={kin.phone}
                      onChange={(e) => handleNextOfKinChange(index, 'phone', e.target.value)}
                      className="input-field"
                      placeholder="Contact number"
                    />
                  </div>
                  <div className="flex items-end">
                    {nextOfKin.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeNextOfKin(index)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Record'}
              </button>
              <Link href="/burial-records" className="btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
