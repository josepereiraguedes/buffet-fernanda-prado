
export type UserRole = 'ADMIN' | 'STAFF';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  rating?: number; // 0-5 stars
  skills?: string[];
  phone?: string;
  type?: 'FIXO' | 'AVULSO' | 'DIARISTA';
  uniforms?: string[]; // e.g. "Calça Preta", "Camisa Branca"
  points?: number; // Gamification points
  pixKey?: string; // New field for Payment
}

export type EventStatus = 'ABERTO' | 'EM_FORMACAO' | 'CONCLUIDO' | 'CANCELADO';

export interface EventFunction {
  id: string;
  name: string; // e.g., "Auxiliar de Festa", "Cozinheira"
  description?: string;
  pay: number;
  vacancies: number;
  filled: number;
}

export interface Event {
  id: string;
  title: string;
  date: string; // ISO string
  time: string;
  address: string;
  imageUrl: string;
  type: string; // Casamento, Corporativo
  description: string;
  status: EventStatus;
  functions: EventFunction[];
  valuePartyHelper?: number;
  valueGeneralHelper?: number;
}

export type ApplicationStatus = 'PENDENTE' | 'APROVADO' | 'RECUSADO' | 'LISTA_ESPERA' | 'CANCELADO';

export interface Application {
  id: string;
  eventId: string;
  userId: string;
  functionId: string; // Which role they applied for
  status: ApplicationStatus;
  appliedAt: string;
  cancellationReason?: string; // Reason provided by staff when cancelling
}

export interface Evaluation {
  id: string;
  eventId: string;
  userId: string;
  punctuality: number;
  posture: number;
  productivity: number;
  agility: number;
  presence: boolean;
  notes: string;
  average: number;
}

export interface Notification {
  id: string;
  type: 'ALERT' | 'INFO' | 'SUCCESS';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  targetRole: UserRole; // Who should see this?
  targetUserId?: string; // Specific user (optional)
}
