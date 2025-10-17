import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminOnly } from '@/components/AdminOnly';

interface UserProfile {
  id: string;
  email: string;
  firstname: string | null;
  lastname: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  role?: string;
}

interface FormData {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  is_active: boolean;
}

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    role: 'user',
    is_active: true
  });

  useEffect(() => {
    loadUsers();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadUsers = async () => {
    setLoading(true);
    
    // Lade alle User Profiles
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!profiles) {
      setLoading(false);
      return;
    }
    
    // Lade Rollen für alle User
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role');
    
    // Kombiniere Profiles mit Rollen
    const enrichedUsers = profiles.map(profile => {
      const userRole = roles?.find(r => r.user_id === profile.id);
      return {
        ...profile,
        role: userRole?.role || 'user'
      };
    });
    
    setUsers(enrichedUsers);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // UPDATE user_profiles
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            firstname: formData.firstname,
            lastname: formData.lastname,
            is_active: formData.is_active
          })
          .eq('id', editingUser.id);
        
        if (profileError) {
          console.error('Profile update error:', profileError);
          throw new Error(`Profil-Update fehlgeschlagen: ${profileError.message}`);
        }
        
        // Update Rolle in user_roles
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: formData.role })
          .eq('user_id', editingUser.id);
        
        if (roleError) {
          console.error('Role update error:', roleError);
          // Nicht kritisch, weiter machen
        }
        
        // Passwort ändern falls angegeben
        if (formData.password && formData.password.length >= 8) {
          console.log('Updating password via edge function...');
          const { data, error: passwordError } = await supabase.functions.invoke('manage-user', {
            body: {
              action: 'update_password',
              userId: editingUser.id,
              updates: { password: formData.password }
            }
          });
          
          if (passwordError) {
            console.error('Password update error:', passwordError);
            toast.warning('Nutzer aktualisiert, aber Passwort konnte nicht geändert werden');
          } else {
            toast.success('Nutzer und Passwort erfolgreich aktualisiert');
          }
        } else {
          toast.success('Nutzer erfolgreich aktualisiert');
        }
      } else {
        // CREATE - Nutze Edge Function
        const { data, error } = await supabase.functions.invoke('setup-first-admin', {
          body: {
            email: formData.email,
            password: formData.password,
            firstname: formData.firstname,
            lastname: formData.lastname,
            role: formData.role,
            is_active: formData.is_active
          }
        });
        
        if (error) {
          console.error('Create user error:', error);
          throw new Error(`Nutzer-Erstellung fehlgeschlagen: ${error.message}`);
        }
        
        toast.success('Nutzer erfolgreich erstellt');
      }
      
      closeModal();
      loadUsers();
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Fehler beim Speichern');
    }
  };

  const handleToggleActive = async (user: UserProfile) => {
    console.log('=== TOGGLE ACTIVE START ===');
    console.log('User:', user);
    console.log('New status:', !user.is_active);
    
    try {
      const newStatus = !user.is_active;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ is_active: newStatus })
        .eq('id', user.id)
        .select();
      
      console.log('Update response:', { data, error });
      
      if (error) {
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw new Error(`Status konnte nicht geändert werden: ${error.message}`);
      }
      
      console.log('Success! Updated user:', data);
      toast.success(newStatus ? 'Nutzer aktiviert' : 'Nutzer deaktiviert');
      loadUsers();
    } catch (error: any) {
      console.error('=== TOGGLE ERROR ===', error);
      toast.error(error.message || 'Fehler beim Ändern des Status');
    }
    
    console.log('=== TOGGLE ACTIVE END ===');
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (user.id === currentUserId) {
      toast.error('Sie können sich nicht selbst löschen');
      return;
    }
    
    const confirmed = confirm(
      `Möchten Sie den Nutzer "${user.firstname} ${user.lastname}" wirklich löschen?\n\n` +
      `Dies löscht:\n` +
      `- Das Benutzerkonto\n` +
      `- Alle Zuordnungen\n\n` +
      `HINWEIS: Von diesem Nutzer erstellte Bewertungen bleiben erhalten.\n\n` +
      `Dies kann nicht rückgängig gemacht werden!`
    );
    
    if (!confirmed) return;
    
    try {
      console.log('=== DELETE USER START ===');
      console.log('Deleting user:', user);
      
      // 1. Lösche aus user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);
      
      if (roleError) {
        console.error('Delete role error:', roleError);
        // Weiter machen, da nicht kritisch
      }
      
      // 2. Lösche aus user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.id);
      
      if (profileError) {
        console.error('Delete profile error:', profileError);
        throw new Error(`Nutzer konnte nicht gelöscht werden: ${profileError.message}`);
      }
      
      // 3. Lösche aus Supabase Auth via Edge Function
      console.log('Deleting from auth via edge function...');
      const { data, error: authError } = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'delete_user',
          userId: user.id
        }
      });
      
      if (authError) {
        console.error('Delete auth error:', authError);
        toast.warning('Profil gelöscht, aber Auth-Account konnte nicht entfernt werden');
      } else {
        console.log('Auth deletion successful:', data);
        toast.success('Nutzer erfolgreich gelöscht');
      }
      
      loadUsers();
      console.log('=== DELETE USER END ===');
    } catch (error: any) {
      console.error('=== DELETE ERROR ===', error);
      toast.error(error.message || 'Löschen fehlgeschlagen');
    }
  };

  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      firstname: user.firstname || '',
      lastname: user.lastname || '',
      email: user.email,
      password: '',
      role: (user.role === 'admin' ? 'admin' : 'user') as 'admin' | 'user',
      is_active: user.is_active
    });
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingUser(null);
    setFormData({
      firstname: '',
      lastname: '',
      email: '',
      password: '',
      role: 'user',
      is_active: true
    });
  };

  return (
    <AdminOnly>
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            ← Zurück zum Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Nutzerverwaltung
              </h1>
              <p className="text-gray-400">
                Nur für Administratoren
              </p>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
            >
              Neuen Nutzer erstellen
            </button>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mb-6"></div>
        
        {/* Nutzer-Tabelle */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Lade Nutzer...</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">E-Mail</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Rolle</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Letzter Login</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-gray-700 hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      {user.is_active ? (
                        <span className="text-green-500 text-xl">✓</span>
                      ) : (
                        <span className="text-red-500 text-xl">✗</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.firstname} {user.lastname}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        user.role === 'admin' 
                          ? 'bg-orange-500/20 text-orange-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'Nutzer'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleDateString('de-DE')
                        : 'Noch nie'
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                        >
                          Bearbeiten
                        </button>
                        
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            user.is_active
                              ? 'bg-yellow-600 hover:bg-yellow-700'
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {user.is_active ? 'Deaktivieren' : 'Aktivieren'}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteUser(user)}
                          disabled={user.id === currentUserId}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm transition-colors"
                        >
                          Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Create/Edit Modal */}
        {(showCreateModal || editingUser) && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingUser ? 'Nutzer bearbeiten' : 'Neuen Nutzer erstellen'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Vorname */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Vorname *
                  </label>
                  <input
                    type="text"
                    value={formData.firstname}
                    onChange={(e) => setFormData({...formData, firstname: e.target.value})}
                    required
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                
                {/* Nachname */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nachname *
                  </label>
                  <input
                    type="text"
                    value={formData.lastname}
                    onChange={(e) => setFormData({...formData, lastname: e.target.value})}
                    required
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                
                {/* E-Mail */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    E-Mail *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    disabled={!!editingUser}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-orange-500 focus:outline-none disabled:opacity-50"
                  />
                  {editingUser && (
                    <p className="text-xs text-gray-400 mt-1">E-Mail kann nicht geändert werden</p>
                  )}
                </div>
                
                {/* Passwort */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {editingUser ? 'Neues Passwort (optional)' : 'Passwort *'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required={!editingUser}
                    placeholder={editingUser ? 'Leer lassen um nicht zu ändern' : ''}
                    minLength={8}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {editingUser 
                      ? 'Mindestens 8 Zeichen. Leer lassen, wenn Passwort nicht geändert werden soll.'
                      : 'Mindestens 8 Zeichen'
                    }
                  </p>
                </div>
                
                {/* Rolle */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Rolle *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="user"
                        checked={formData.role === 'user'}
                        onChange={(e) => setFormData({...formData, role: e.target.value as 'admin' | 'user'})}
                        className="text-orange-500"
                      />
                      <div>
                        <div className="font-medium">Nutzer</div>
                        <div className="text-xs text-gray-400">Kann Bewertungen erstellen und bearbeiten</div>
                      </div>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="admin"
                        checked={formData.role === 'admin'}
                        onChange={(e) => setFormData({...formData, role: e.target.value as 'admin' | 'user'})}
                        className="text-orange-500"
                      />
                      <div>
                        <div className="font-medium">Admin</div>
                        <div className="text-xs text-gray-400">Alle Rechte + Nutzerverwaltung</div>
                      </div>
                    </label>
                  </div>
                </div>
                
                {/* Status */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="text-orange-500"
                    />
                    <span className="text-sm">Nutzer ist aktiv</span>
                  </label>
                </div>
                
                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Abbrechen
                  </button>
                  
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
                  >
                    {editingUser ? 'Speichern' : 'Erstellen'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminOnly>
  );
};

export default Users;
