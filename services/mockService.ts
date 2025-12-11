import { supabase } from './supabaseClient';
import { User, Event, Application, Evaluation, ApplicationStatus, Notification, EventFunction, UserMetrics } from '../types';

// Helper to handle local metrics persistence since DB might lack the column
const getLocalMetrics = (): Record<string, UserMetrics> => {
    try {
        return JSON.parse(localStorage.getItem('fp_user_metrics') || '{}');
    } catch { return {}; }
};

const saveLocalMetrics = (userId: string, metrics: UserMetrics) => {
    const all = getLocalMetrics();
    all[userId] = metrics;
    localStorage.setItem('fp_user_metrics', JSON.stringify(all));
};

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

    // AUTO-HEALING: If auth exists but profile is missing (e.g., DB wipe), create it now.
    if (!profile) {
        console.warn("Profile missing for existing auth user. Recreating...");
        const recoveredUser = await MockService.recreateMissingProfile(
            authData.user.id, 
            authData.user.email!, 
            authData.user.user_metadata.name || 'Usuário Recuperado',
            authData.user.user_metadata.phone || ''
        );
        return recoveredUser;
    }

    // Merge with local metrics if available
    const localMetrics = getLocalMetrics()[profile.id];

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
        points: profile.points,
        metrics: localMetrics || profile.metrics
    };
    
    localStorage.setItem('fp_current_user', JSON.stringify(user));
    return user;
  },

  // Helper to fix broken state
  recreateMissingProfile: async (id: string, email: string, name: string, phone: string): Promise<User> => {
        const newUserProfile = {
            id,
            name,
            email,
            phone,
            role: 'STAFF',
            type: 'AVULSO',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
            rating: 5.0,
            points: 0,
            metrics: { punctuality: 5, posture: 5, productivity: 5, agility: 5 }
        };
        
        await supabase.from('profiles').insert(newUserProfile);
        
        const user: User = {
            ...newUserProfile,
            metrics: newUserProfile.metrics
        } as User;
        
        localStorage.setItem('fp_current_user', JSON.stringify(user));
        return user;
  },

  registerUser: async (name: string, email: string, phone: string, password: string): Promise<User> => {
    // 1. Try to Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name,
                phone,
                role: 'STAFF',
                type: 'AVULSO'
            }
        }
    });

    // 1.b HANDLE "ALREADY REGISTERED" ERROR with Self-Healing
    if (authError) {
        if (authError.message.includes('already registered') || authError.status === 422) {
            console.log("User exists in Auth. Attempting login/recovery...");
            
            // Try to login with provided password
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (loginError) {
                // Password incorrect or other issue
                throw new Error("Este email já está cadastrado. Tente fazer login.");
            }

            if (loginData.user) {
                // Login success -> Check if profile exists
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', loginData.user.id).single();
                
                if (!profile) {
                    // Auth exists, but Profile is missing (DB Wipe scenario). Recreate it.
                    return await MockService.recreateMissingProfile(loginData.user.id, email, name, phone);
                } else {
                    // Profile exists too. Just return the user (Login successful)
                    return await MockService.login(email, password) as User;
                }
            }
        }
        throw authError;
    }

    if (!authData.user) throw new Error("Erro ao criar usuário Auth");

    // 2. Wait a moment for Trigger to create profile or Create Manually if trigger fails
    let profile = null;
    let attempts = 0;
    while (!profile && attempts < 3) {
        const { data } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
        if (data) profile = data;
        else await new Promise(r => setTimeout(r, 500)); // wait 500ms
        attempts++;
    }

    // If trigger failed, insert manually
    if (!profile) {
        return await MockService.recreateMissingProfile(authData.user.id, email, name, phone);
    }

    // Save initial metrics locally
    const initialMetrics = { punctuality: 5, posture: 5, productivity: 5, agility: 5 };
    saveLocalMetrics(authData.user.id, initialMetrics);

    // Return User Object
    const user: User = {
        id: authData.user.id,
        name: name,
        email: email,
        phone: phone,
        role: 'STAFF', 
        type: 'AVULSO',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`,
        rating: 5.0,
        metrics: initialMetrics
    } as User;
    
    // If email confirmation is required, the session might be null.
    if (authData.session) {
        localStorage.setItem('fp_current_user', JSON.stringify(user));
    }
    
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
        console.warn("Using local events due to DB error");
        const local = localStorage.getItem('fp_events');
        return local ? JSON.parse(local) : [];
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
    try {
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

        // 2. Handle Functions
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
    } catch (e) {
        console.warn("DB Save failed, updating local storage fallback");
        // Simple fallback for demo purposes if DB is down/locked
        const local = JSON.parse(localStorage.getItem('fp_events') || '[]');
        const idx = local.findIndex((ev: Event) => ev.id === event.id);
        if (idx >= 0) local[idx] = event;
        else local.push(event);
        localStorage.setItem('fp_events', JSON.stringify(local));
    }
  },

  // Applications
  getApplications: async (): Promise<Application[]> => {
    const { data, error } = await supabase.from('applications').select('*');
    if (error) {
        const local = localStorage.getItem('fp_applications');
        return local ? JSON.parse(local) : [];
    }
    
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
    // Validation: Check if IDs are real (not mock strings)
    if (app.functionId.startsWith('f_') || app.eventId.startsWith('e_')) {
        // Allow in mock mode, but warn
        console.warn("Using mock IDs for application");
    }

    try {
        // 1. Insert Application
        const { error } = await supabase.from('applications').insert({
            event_id: app.eventId,
            user_id: app.userId,
            function_id: app.functionId,
            status: 'PENDENTE',
            applied_at: new Date().toISOString()
        });
        
        if (error) throw error;
    } catch (e) {
        // Local Fallback
        const local = JSON.parse(localStorage.getItem('fp_applications') || '[]');
        local.push({ ...app, id: `app_${Date.now()}` });
        localStorage.setItem('fp_applications', JSON.stringify(local));
    }

    // 2. Create Notification for Admin
    try {
        const currentUser = MockService.getCurrentUser();
        // Try fetch event title
        const events = await MockService.getEvents();
        const event = events.find(e => e.id === app.eventId);
        
        await MockService.createNotification({
            id: `n_${Date.now()}`,
            type: 'INFO',
            title: 'Nova Candidatura',
            message: `${currentUser?.name || 'Um colaborador'} se candidatou para o evento: ${event?.title || 'Evento'}.`,
            createdAt: new Date().toISOString(),
            read: false,
            targetRole: 'ADMIN'
        });
    } catch (e) {
        console.warn("Could not create notification", e);
    }
  },

  updateApplicationStatus: async (appId: string, newStatus: ApplicationStatus) => {
    try {
        // 1. Get Application
        let app;
        const { data: dbApp, error: fetchError } = await supabase.from('applications').select('*').eq('id', appId).single();
        
        if (fetchError || !dbApp) {
             // Try local
             const localApps = JSON.parse(localStorage.getItem('fp_applications') || '[]');
             app = localApps.find((a:any) => a.id === appId);
             if (!app) throw new Error("Candidatura não encontrada.");
             
             // Update Local
             app.status = newStatus;
             localStorage.setItem('fp_applications', JSON.stringify(localApps));
        } else {
             app = dbApp;
             // Update DB
             await supabase.from('applications').update({ status: newStatus }).eq('id', appId);
        }

        const oldStatus = app.status || app.status; // redundancy check

        // 3. Update Function Filled Count (DB Only logic mostly, unless we mock functions too)
        if (newStatus === 'APROVADO' && oldStatus !== 'APROVADO') {
            try {
                const { data: func } = await supabase.from('event_functions').select('filled, vacancies').eq('id', app.function_id || app.functionId).single();
                if (func && func.filled < func.vacancies) {
                    await supabase.from('event_functions').update({ filled: func.filled + 1 }).eq('id', app.function_id || app.functionId);
                }
            } catch (e) { /* ignore if functions table issues */ }
        } else if (oldStatus === 'APROVADO' && newStatus !== 'APROVADO') {
            try {
                const { data: func } = await supabase.from('event_functions').select('filled').eq('id', app.function_id || app.functionId).single();
                if (func) {
                    await supabase.from('event_functions').update({ filled: Math.max(0, func.filled - 1) }).eq('id', app.function_id || app.functionId);
                }
            } catch (e) { /* ignore */ }
        }
        
        // 4. Notify
        await MockService.createNotification({
            id: `n_${Date.now()}`,
            type: newStatus === 'APROVADO' ? 'SUCCESS' : newStatus === 'RECUSADO' ? 'ALERT' : 'INFO',
            title: 'Atualização de Candidatura',
            message: `O status da sua candidatura mudou para: ${newStatus}`,
            createdAt: new Date().toISOString(),
            read: false,
            targetRole: 'STAFF',
            targetUserId: app.user_id || app.userId
        });

    } catch (error) {
        console.error("Update Status Error", error);
        throw error;
    }
  },

  cancelApplication: async (appId: string, reason: string) => {
      try {
        const { error } = await supabase.from('applications').update({ 
            status: 'CANCELADO',
            cancellation_reason: reason
        }).eq('id', appId);
        
        if (error) throw error;
      } catch (e) {
         // Local fallback
         const localApps = JSON.parse(localStorage.getItem('fp_applications') || '[]');
         const idx = localApps.findIndex((a:any) => a.id === appId);
         if (idx >= 0) {
             localApps[idx].status = 'CANCELADO';
             localApps[idx].cancellationReason = reason;
             localStorage.setItem('fp_applications', JSON.stringify(localApps));
         }
      }

      // Decrement logic skipped for brevity in fallback, assumed handled by refresh
  },

  // Users List (Admin)
  getUsers: async (): Promise<User[]> => {
      let users: User[] = [];
      
      const { data, error } = await supabase.from('profiles').select('*');
      
      if (!error && data) {
          users = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            role: p.role,
            avatar: p.avatar,
            rating: p.rating,
            type: p.type,
            phone: p.phone,
            skills: p.skills,
            uniforms: p.uniforms,
            pixKey: p.pix_key,
            metrics: p.metrics // Attempt to read from DB
          }));
      }

      // Merge with local metrics overrides
      const localMetrics = getLocalMetrics();
      
      return users.map(u => ({
          ...u,
          metrics: localMetrics[u.id] || u.metrics // Local takes precedence if DB null
      }));
  },

  saveUser: async (user: User) => {
      // 1. Save Metrics Locally (Reliable persistence)
      if (user.metrics) {
          saveLocalMetrics(user.id, user.metrics);
      }

      // 2. Save basic info to Supabase (Exclude metrics to prevent 400 Bad Request)
      const payload = {
          name: user.name,
          phone: user.phone,
          type: user.type,
          skills: user.skills,
          uniforms: user.uniforms,
          pix_key: user.pixKey,
          avatar: user.avatar,
          // metrics: user.metrics <-- OMITTED to fix 400 error
      };

      try {
          const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
          if (error) throw error;
      } catch (e) {
          console.warn("Supabase profile update failed, partial save only.");
      }
  },
  
  deleteUser: async (userId: string) => {
      await supabase.from('profiles').delete().eq('id', userId);
  },

  // Evaluations
  getEvaluations: async (): Promise<Evaluation[]> => {
      try {
          const { data, error } = await supabase.from('evaluations').select('*');
          if (!error && data) {
              return data.map((e: any) => ({
                  id: e.id,
                  eventId: e.event_id,
                  userId: e.user_id,
                  punctuality: e.punctuality,
                  posture: e.posture,
                  productivity: e.productivity,
                  agility: e.agility,
                  presence: e.presence,
                  notes: e.notes,
                  average: e.average
              }));
          }
      } catch (e) { /* ignore 404 */ }

      // Fallback
      const local = localStorage.getItem('fp_evaluations');
      return local ? JSON.parse(local) : [];
  },

  // This is for General Admin Performance Review (Not event specific)
  updateUserPerformance: async (userId: string, metrics: UserMetrics) => {
      // 1. Calculate Average
      const average = (metrics.punctuality + metrics.posture + metrics.productivity + metrics.agility) / 4;
      const roundedAverage = Math.round(average * 10) / 10;
      
      // 2. Save Metrics Locally (Guaranteed persistence)
      saveLocalMetrics(userId, metrics);

      // 3. Create Evaluation Record (Try DB, then Local)
      const evaluation: Evaluation = {
          id: `ev_${Date.now()}`,
          eventId: 'manual_admin_update',
          userId: userId,
          ...metrics,
          presence: true,
          notes: "Atualização de desempenho manual",
          average: roundedAverage
      };
      
      await MockService.saveEvaluation(evaluation);

      // 4. Update Rating in Profile (DB Only for rating column)
      try {
        await supabase.from('profiles').update({ 
            rating: roundedAverage,
            // metrics: metrics <-- OMITTED
        }).eq('id', userId);
      } catch (e) {
          console.warn("Could not update rating in DB", e);
      }
      
      // 5. Notify
      await MockService.createNotification({
          id: `n_${Date.now()}`,
          type: 'INFO',
          title: 'Perfil Atualizado',
          message: `Sua avaliação de desempenho foi atualizada pela administração.`,
          createdAt: new Date().toISOString(),
          read: false,
          targetRole: 'STAFF',
          targetUserId: userId
      });
  },

  saveEvaluation: async (evaluation: Evaluation) => {
      const payload = {
          event_id: evaluation.eventId,
          user_id: evaluation.userId,
          punctuality: evaluation.punctuality,
          posture: evaluation.posture,
          productivity: evaluation.productivity,
          agility: evaluation.agility,
          presence: evaluation.presence,
          notes: evaluation.notes,
          average: evaluation.average,
          created_at: new Date().toISOString()
      };

      let savedToDb = false;
      try {
          const { error } = await supabase.from('evaluations').insert(payload);
          if (!error) savedToDb = true;
      } catch (e) { /* 404 likely */ }
      
      if (!savedToDb) {
           const local = localStorage.getItem('fp_evaluations');
           const list = local ? JSON.parse(local) : [];
           list.push(evaluation);
           localStorage.setItem('fp_evaluations', JSON.stringify(list));
      }
  },

  // Notifications 
  getNotifications: async (): Promise<Notification[]> => {
      try {
        const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
        if (!error && data) {
            return data.map((n: any) => ({
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                createdAt: n.created_at,
                read: n.read,
                targetRole: n.target_role,
                targetUserId: n.target_user_id
            }));
        }
      } catch (e) { /* ignore 404 */ }

      const local = localStorage.getItem('fp_notifications');
      return local ? JSON.parse(local) : [];
  },

  createNotification: async (n: Notification) => {
      let savedToDb = false;
      try {
        const { error } = await supabase.from('notifications').insert({
            type: n.type,
            title: n.title,
            message: n.message,
            created_at: n.createdAt,
            read: n.read,
            target_role: n.targetRole,
            target_user_id: n.targetUserId
        });
        if (!error) savedToDb = true;
      } catch (e) { /* 404 */ }

      if (!savedToDb) {
          const local = localStorage.getItem('fp_notifications');
          const list = local ? JSON.parse(local) : [];
          list.unshift(n);
          localStorage.setItem('fp_notifications', JSON.stringify(list));
      }
  },

  markNotificationAsRead: async (id: string) => {
      try {
         await supabase.from('notifications').update({ read: true }).eq('id', id);
      } catch (e) {
          // Local update
          const local = JSON.parse(localStorage.getItem('fp_notifications') || '[]');
          const idx = local.findIndex((n:any) => n.id === id);
          if (idx >= 0) {
              local[idx].read = true;
              localStorage.setItem('fp_notifications', JSON.stringify(local));
          }
      }
  }
};