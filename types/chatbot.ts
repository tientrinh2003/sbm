// types/chatbot.ts - Type definitions for enhanced chatbot integration

export interface UserContext {
  id: string;
  name?: string;
  email?: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  dateOfBirth?: Date;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  phone?: string;
}

export interface MeasurementData {
  id: string;
  sys: number;
  dia: number;
  pulse: number;
  method: 'BLUETOOTH' | 'MANUAL';
  takenAt: string; // ISO string instead of Date
  trend?: {
    average_sys: number;
    average_dia: number;
    trend: 'INCREASING' | 'DECREASING' | 'STABLE';
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

export interface PatientSummary {
  latest_measurements: MeasurementData[];
  measurement_count: number;
  avg_sys: number;
  avg_dia: number;
  risk_assessment: string;
  recent_notes?: string[];
}

export interface DoctorContext {
  assigned_patients_count: number;
  recent_alerts?: string[];
  pending_reviews?: number;
}

export interface ChatbotRequest {
  message: string;
  user_id: string;
  conversation_id?: string;
  context: {
    user: UserContext;
    role_specific_data?: PatientSummary | DoctorContext;
    timestamp: string;
    session_metadata?: {
      device_info?: string;
      location?: string;
    };
  };
}

export interface ChatbotResponse {
  success: boolean;
  response: string;
  conversation_id: string;
  suggestions?: string[];
  requires_medical_attention?: boolean;
  data_insights?: {
    mentioned_measurements?: boolean;
    health_recommendations?: string[];
    follow_up_actions?: string[];
  };
  error?: string; // For error cases
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  context?: {
    referenced_data?: string[];
    suggestions?: string[];
    requires_attention?: boolean;
  };
}