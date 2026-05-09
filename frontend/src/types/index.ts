export interface User {
  user_id: number;
  full_name: string;
  email: string;
  phone_number?: string;
  cnic?: string;
  role: 'user' | 'admin' | 'staff' | 'cemetery_manager' | 'funeral_coordinator';
  created_at?: string;
  is_active?: boolean;
}

export interface DeathCase {
  case_id: number;
  registration_number: string;
  deceased_name: string;
  gender?: string;
  age?: number;
  cnic?: string;
  date_of_death: string;
  cause_of_death?: string;
  next_of_kin_name: string;
  next_of_kin_contact: string;
  next_of_kin_relation?: string;
  status: 'pending' | 'under_review' | 'approved' | 'allocated' | 'completed';
  submitted_by_user_id?: number;
  assigned_staff_id?: number;
  submitted_by_name?: string;
  assigned_staff_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Cemetery {
  cemetery_id: number;
  name: string;
  address?: string;
  city: string;
  total_capacity: number;
  available_plots: number;
  status: 'active' | 'maintenance';
  type: 'premium' | 'heritage' | 'standard';
  created_at: string;
  total_sections?: number;
  total_available_plots?: number;
}

export interface Section {
  section_id: number;
  cemetery_id: number;
  section_name: string;
  section_code: string;
  total_plots: number;
  available_plots: number;
  description?: string;
  available_graves?: number;
  occupied_graves?: number;
  reserved_graves?: number;
}

export interface Grave {
  grave_id: number;
  section_id: number;
  plot_id: string;
  plot_type: 'standard' | 'family' | 'cremation' | 'estate';
  status: 'available' | 'reserved' | 'occupied';
  dimensions?: string;
  capacity: number;
  premium_tier?: string;
  base_price?: number;
  maintenance_plan?: string;
  created_at: string;
  section_name?: string;
  section_code?: string;
  cemetery_name?: string;
  city?: string;
}

export interface Reservation {
  reservation_id: number;
  reservation_number: string;
  grave_id: number;
  user_id: number;
  primary_contact?: string;
  phone_number?: string;
  email?: string;
  reservation_purpose?: string;
  status: 'pending' | 'approved' | 'cancelled' | 'expired';
  holding_fee?: number;
  expiry_date: string;
  linked_case_id?: number;
  created_at: string;
  plot_id?: string;
  plot_type?: string;
  section_name?: string;
  cemetery_name?: string;
}

export interface BurialRecord {
  record_id: number;
  record_number: string;
  case_id: number;
  grave_id: number;
  funeral_director?: string;
  burial_type?: string;
  date_of_service?: string;
  officiating_clergy?: string;
  religious_affiliation?: string;
  vault_type?: string;
  memorial_type?: string;
  plot_ownership?: string;
  remarks?: string;
  created_at: string;
  deceased_name?: string;
  gender?: string;
  age?: number;
  date_of_death?: string;
  next_of_kin_name?: string;
  next_of_kin_contact?: string;
  plot_id?: string;
  plot_type?: string;
  section_name?: string;
  cemetery_name?: string;
}

export interface FuneralService {
  service_id: number;
  case_id: number;
  service_type: 'ghusl' | 'kafan' | 'janaza' | 'transport' | 'other';
  scheduled_datetime?: string;
  assigned_staff_id?: number;
  location?: string;
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  completed_at?: string;
  rejection_reason?: string;
  preferred_datetime?: string;
  price?: number;
  requested_by_user_id?: number;
}

export interface CaseStatusHistory {
  history_id: number;
  case_id: number;
  old_status?: string;
  new_status: string;
  changed_by_user_id?: number;
  changed_by_name?: string;
  notes?: string;
  changed_at: string;
}

export interface ApiResponse<T> {
  message?: string;
  error?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
