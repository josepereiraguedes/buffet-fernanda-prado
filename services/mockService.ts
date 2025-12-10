import { supabase } from './supabaseClient';
import { User, Event, Application, Evaluation, ApplicationStatus, Notification, EventFunction } from '../types';

// Adapting the interface to be Async since Supabase is Async
export const MockService = {
  // Auth & Profiles
  login: async (email: string, password: string): Promise<User | null> => {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    
    if (error || !authData.user) throw error || new Error('Falha no login');

    // Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

    if (!profile) return null;

    const user: User = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        avatar: profile.avatar || `https://ui-avatars.com/api/?name=${profile.name}`,
        rating: profile.rating,
        type: profile.type,
        phone: profile.phone,
        pixKey: profile.pix_key,
        skills: profile.skills,
        uniforms: profile.uniforms,
        points: profile.points
    };
    
    localStorage.setItem('fp_current_user', JSON.stringify(user));
    return user;
  },

  registerUser: async (name: string, email: string, phone: string, password: string): Promise<User> => {
    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Erro ao criar usuário Auth");

    // 2. Create Profile
    const newUserProfile = {
        id: authData.user.id,
        name,
        email,
        phone,
        role: 'STAFF',
        type: 'AVULSO',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        rating: 5.0,
        points: 0,
    };

    const { error: dbError } = await supabase.from('profiles').insert(newUserProfile);
    if (dbError) throw dbError;

    // Return User Object
    const user: User = {
        ...newUserProfile,
        role: 'STAFF', 
        type: 'AVULSO'
    } as User;
    
    localStorage.setItem('fp_current_user', JSON.stringify(user));
    return user;
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('fp_current_user');
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem('fp_current_user');
    return stored ? JSON.parse(stored) : null;
  },

  // Events
  getEvents: async (): Promise<Event[]> => {
    const { data: eventsData, error } = await supabase
        .from('events')
        .select(`*, functions:event_functions(*)`)
        .order('date', { ascending: true });

    if (error) {
        console.error("Error fetching events", error);
        return [];
    }

    // Map DB structure to App structure
    return eventsData.map((e: any) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        time: e.time,
        address: e.address,
        imageUrl: e.image_url,
        type: e.type,
        description: e.description,
        status: e.status,
        functions: e.functions.map((f: any) => ({
            id: f.id,
            name: f.name,
            pay: f.pay,
            vacancies: f.vacancies,
            filled: f.filled
        }))
    }));
  },

  saveEvent: async (event: Event) => {
    // 1. Upsert Event
    const eventPayload = {
        title: event.title,
        date: event.date,
        time: event.time,
        address: event.address,
        image_url: event.imageUrl,
        type: event.type,
        description: event.description,
        status: event.status
    };

    let eventId = event.id.startsWith('e_') ? undefined : event.id; // Handle mock IDs

    const { data: savedEvent, error } = await supabase
        .from('events')
        .upsert(eventId ? { ...eventPayload, id: eventId } : eventPayload)
        .select()
        .single();
    
    if (error || !savedEvent) throw error;
    eventId = savedEvent.id;

    // 2. Handle Functions (Delete old, Insert new - simplistic approach)
    // In production, we should upsert properly. For now, we will create new ones if not existing.
    if (event.functions && event.functions.length > 0) {
        for (const f of event.functions) {
            if (f.id.startsWith('f_')) {
                // It's a new function or mock function
                await supabase.from('event_functions').insert({
                    event_id: eventId,
                    name: f.name,
                    pay: f.pay,
                    vacancies: f.vacancies,
                    filled: 0
                });
            } else {
                // Update existing
                await supabase.from('event_functions').update({
                   name: f.name,
                   pay: f.pay,
                   vacancies: f.vacancies
                }).eq('id', f.id);
            }
        }
    }
  },

  // Applications
  getApplications: async (): Promise<Application[]> => {
    const { data, error } = await supabase.from('applications').select('*');
    if (error) return [];
    
    return data.map((a: any) => ({
        id: a.id,
        eventId: a.event_id,
        userId: a.user_id,
        functionId: a.function_id,
        status: a.status,
        appliedAt: a.applied_at,
        cancellationReason: a.cancellation_reason
    }));
  },

  createApplication: async (app: Application) => {
    const { error } = await supabase.from('applications').insert({
        event_id: app.eventId,
        user_id: app.userId,
        function_id: app.functionId,
        status: 'PENDENTE',
        applied_at: new Date().toISOString()
    });
    if (error) throw error;
  },

  updateApplicationStatus: async (appId: string, newStatus: ApplicationStatus) => {
    // 1. Get Application to find functionId
    const { data: app } = await supabase.from('applications').select('*').eq('id', appId).single();
    if (!app) return;

    const oldStatus = app.status;

    // 2. Update Status
    await supabase.from('applications').update({ status: newStatus }).eq('id', appId);

    // 3. Update Function Filled Count
    if (newStatus === 'APROVADO' && oldStatus !== 'APROVADO') {
         await supabase.rpc('increment_filled', { row_id: app.function_id }); // Need RPC or manual select/update
         // Manual fallback since RPC might not exist
         const { data: func } = await supabase.from('event_functions').select('filled').eq('id', app.function_id).single();
         if (func) {
             await supabase.from('event_functions').update({ filled: func.filled + 1 }).eq('id', app.function_id);
         }
    } else if (oldStatus === 'APROVADO' && newStatus !== 'APROVADO') {
         const { data: func } = await supabase.from('event_functions').select('filled').eq('id', app.function_id).single();
         if (func) {
             await supabase.from('event_functions').update({ filled: Math.max(0, func.filled - 1) }).eq('id', app.function_id);
         }
    }
  },

  cancelApplication: async (appId: string, reason: string) => {
      await supabase.from('applications').update({ 
          status: 'CANCELADO',
          cancellation_reason: reason
      }).eq('id', appId);
  },

  // Users List (Admin)
  getUsers: async (): Promise<User[]> => {
      const { data } = await supabase.from('profiles').select('*');
      if (!data) return [];
      return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        role: p.role,
        avatar: p.avatar,
        rating: p.rating,
        type: p.type,
        phone: p.phone,
        skills: p.skills,
        uniforms: p.uniforms
      }));
  },

  saveUser: async (user: User) => {
      await supabase.from('profiles').update({
          name: user.name,
          phone: user.phone,
          type: user.type,
          skills: user.skills,
          uniforms: user.uniforms,
          pix_key: user.pixKey,
          avatar: user.avatar
      }).eq('id', user.id);
  },

  // Evaluations
  getEvaluations: async (): Promise<Evaluation[]> => {
      // Mock for now or implement table
      return []; 
  },
  saveEvaluation: async (evaluation: Evaluation) => {
      // Mock for now
  },

  // Notifications (Local simulation for now since we lack realtime setup in this snippet)
  getNotifications: () => [],
  createNotification: (n: Notification) => {},
  markNotificationAsRead: (id: string) => {}
};
