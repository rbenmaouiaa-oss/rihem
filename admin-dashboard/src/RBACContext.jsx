import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useNavigate } from 'react-router-dom';

const RBACContext = createContext(null);

export function RBACProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    initSession();
  }, []);

  async function initSession() {
    try {
      const savedEmail = localStorage.getItem('email');
      if (savedEmail) {
        const { data: dbUsers, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('email', savedEmail);

        if (!dbError && dbUsers && dbUsers.length > 0) {
          const dbUser = dbUsers[0];
          setUser(dbUser);
          setRole(dbUser.role);
          await fetchCollections(dbUser.company_id);
          setLoading(false);
          return;
        }
      }

      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        const mockUser = {
          id: 'f1111111-cdee-4d97-b5ae-a3867e6f3a31',
          email: 'admin@saas.com',
          nom: 'Eddine',
          prenom: 'Ala',
          role: 'SuperAdmin',
          company_id: 'e8f9c122-38b4-4b53-8f67-85bdeee7a99f'
        };
        setUser(mockUser);
        setRole(mockUser.role);
        await fetchCollections(mockUser.company_id);
        setLoading(false);
        return;
      }

      const { data: dbUsers, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email);

      if (dbError || !dbUsers || dbUsers.length === 0) {
        const { data: companyRes } = await supabase.from('companies').select('*').limit(1);
        const targetCoId = companyRes?.[0]?.id || 'e8f9c122-38b4-4b53-8f67-85bdeee7a99f';

        const freshUser = {
          email: authUser.email,
          nom: 'Collaborateur',
          prenom: 'Nouveau',
          role: 'CompanyAdmin',
          company_id: targetCoId
        };

        const { data: insertedUser } = await supabase
          .from('users')
          .insert(freshUser)
          .select()
          .single();

        const activeUser = insertedUser || freshUser;
        setUser(activeUser);
        setRole(activeUser.role);
        await fetchCollections(activeUser.company_id);
      } else {
        const foundUser = dbUsers[0];
        setUser(foundUser);
        setRole(foundUser.role);
        await fetchCollections(foundUser.company_id);
      }
    } catch (err) {
      console.log("RBACContext: Exception caught:", err);
    }
    setLoading(false);
  }

  async function fetchCollections(companyId) {
    try {
      const { data: depts } = await supabase.from('departments').select('*').eq('company_id', companyId);
      if (depts) setDepartments(depts);
    } catch (e) {
      console.log("Error loading departments:", e.message);
    }

    try {
      const { data: brs } = await supabase.from('branches').select('*').eq('company_id', companyId);
      if (brs) setBranches(brs);
    } catch (e) {
      console.log("Error loading branches:", e.message);
    }
  }

  const isAdmin = role === 'CompanyAdmin' || role === 'SuperAdmin';
  const isManager = role === 'Manager';
  const isEmployee = role === 'Employee';
  const canManage = role === 'CompanyAdmin' || role === 'SuperAdmin';
  const canViewAll = role === 'CompanyAdmin' || role === 'SuperAdmin' || role === 'Manager';

  const logout = () => {
    localStorage.removeItem('email');
    navigate('/');
  };

  const value = {
    user,
    role,
    loading,
    isAdmin,
    isManager,
    isEmployee,
    canManage,
    canViewAll,
    logout,
    departments,
    branches
  };

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const ctx = useContext(RBACContext);
  if (!ctx) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return ctx;
}

export default RBACContext;
