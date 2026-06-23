import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import Sidebar from '../Sidebar';

export default function CreerEmploye() {
  const [user, setUser] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    password: 'password123',
    phone: '',
    role: 'Employee',
    department_id: '',
    branch_id: '',
    status: 'active',
    adresse: '',
    code_postal: '',
    ville: '',
    genre: '',
    date_naissance: '',
    date_recrutement: '',
    type_contrat: '',
    etat_civil: '',
    autre_telephone: ''
  });

  useEffect(() => {
    loadUserAndData();
  }, []);

  async function loadUserAndData() {
    const email = localStorage.getItem('email');
    if (!email) return;

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (userData && userData.length > 0) {
      const foundUser = userData[0];
      setUser(foundUser);

      const { data: deptData } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', foundUser.company_id);

      if (deptData) setDepartments(deptData);

      const { data: branchData } = await supabase
        .from('branches')
        .select('*')
        .eq('company_id', userData.company_id);

      if (branchData) setBranches(branchData);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function resetForm() {
    setForm({
      prenom: '',
      nom: '',
      email: '',
      password: 'password123',
      phone: '',
      role: 'Employee',
      department_id: '',
      branch_id: '',
      status: 'active',
      adresse: '',
      code_postal: '',
      ville: '',
      genre: '',
      date_naissance: '',
      date_recrutement: '',
      type_contrat: '',
      etat_civil: '',
      autre_telephone: ''
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSuccess("");

    const { error } = await supabase.from('users').insert({
      company_id: user?.company_id,
      nom: form.nom,
      prenom: form.prenom,
      email: form.email,
      password_hash: form.password,
      phone: form.phone,
      role: form.role,
      department_id: form.department_id || null,
      branch_id: form.branch_id || null,
      status: form.status,
      manager_id: null,
      adresse: form.adresse || null,
      code_postal: form.code_postal || null,
      ville: form.ville || null,
      genre: form.genre || null,
      date_naissance: form.date_naissance || null,
      date_recrutement: form.date_recrutement || null,
      type_contrat: form.type_contrat || null,
      etat_civil: form.etat_civil || null,
      autre_telephone: form.autre_telephone || null
    });

    if (error) {
      alert('Erreur : ' + error.message);
    } else {
      setSuccess(`✓ ${form.prenom} ${form.nom} a été créé avec succès !`);
      resetForm();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <div style={styles.container}>
      <Sidebar />

      <main style={styles.main}>
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h2 style={styles.headerTitle}>L'AVANCE</h2>
            <span style={styles.badgeHeader}>ADMIN</span>
          </div>
          <div style={styles.userProfile}>
            <div style={styles.userAvatar}>A</div>
            <span>Administrateur ▾</span>
          </div>
        </header>

        <div style={styles.content}>
          <h3 style={styles.pageTitle}>Ajouter un collaborateur</h3>

          {success && (
            <div style={styles.successBanner}>{success}</div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.sectionTitle}>Informations personnelles</div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Prénom</label>
                <input name="prenom" value={form.prenom} onChange={handleChange} required style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom</label>
                <input name="nom" value={form.nom} onChange={handleChange} required style={styles.input} />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Téléphone</label>
                <input name="phone" value={form.phone} onChange={handleChange} style={styles.input} />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Genre</label>
                <select name="genre" value={form.genre} onChange={handleChange} style={styles.input}>
                  <option value="">-- Sélectionner --</option>
                  <option value="Masculin">Masculin</option>
                  <option value="Féminin">Féminin</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Date de naissance</label>
                <input name="date_naissance" type="date" value={form.date_naissance} onChange={handleChange} style={styles.input} />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>État civil</label>
                <select name="etat_civil" value={form.etat_civil} onChange={handleChange} style={styles.input}>
                  <option value="">-- Sélectionner --</option>
                  <option value="Célibataire">Célibataire</option>
                  <option value="Marié(e)">Marié(e)</option>
                  <option value="Divorcé(e)">Divorcé(e)</option>
                  <option value="Veuf(ve)">Veuf(ve)</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Autre téléphone</label>
                <input name="autre_telephone" value={form.autre_telephone} onChange={handleChange} style={styles.input} />
              </div>
            </div>

            <div style={styles.sectionTitle}>Adresse</div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Adresse</label>
                <input name="adresse" value={form.adresse} onChange={handleChange} style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Code postal</label>
                <input name="code_postal" value={form.code_postal} onChange={handleChange} style={styles.input} />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Ville</label>
                <input name="ville" value={form.ville} onChange={handleChange} style={styles.input} />
              </div>
              <div style={styles.formGroup}></div>
            </div>

            <div style={styles.sectionTitle}>Informations professionnelles</div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Département</label>
                <select name="department_id" value={form.department_id} onChange={handleChange} style={styles.input}>
                  <option value="">-- Sélectionner --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Bureau / Branch</label>
                <select name="branch_id" value={form.branch_id} onChange={handleChange} style={styles.input}>
                  <option value="">-- Sélectionner --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Rôle de sécurité</label>
                <select name="role" value={form.role} onChange={handleChange} style={styles.input}>
                  <option value="Employee">Employé</option>
                  <option value="Manager">Manager</option>
                  <option value="CompanyAdmin">Administrateur</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Type de contrat</label>
                <select name="type_contrat" value={form.type_contrat} onChange={handleChange} style={styles.input}>
                  <option value="">-- Sélectionner --</option>
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="Stage">Stage</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Alternance">Alternance</option>
                </select>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Date de recrutement</label>
                <input name="date_recrutement" type="date" value={form.date_recrutement} onChange={handleChange} style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Statut</label>
                <select name="status" value={form.status} onChange={handleChange} style={styles.input}>
                  <option value="active">Actif</option>
                  <option value="archived">Archivé</option>
                </select>
              </div>
            </div>

            <div style={styles.formActions}>
              <button type="submit" style={styles.submitBtn}>Enregistrer le collaborateur</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-app)', fontFamily: 'var(--font-sans)', overflow: 'hidden' },
  main: { flex: 1, marginLeft: '280px', display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' },
  header: { height: '70px', backgroundColor: 'var(--bg-header)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 5 },
  headerTitle: { fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--primary)', letterSpacing: '1.5px', margin: 0 },
  badgeHeader: { padding: '3px 8px', fontSize: '10px', fontWeight: '700', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '12px' },
  userProfile: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' },
  userAvatar: { backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  content: { padding: '40px', animation: 'fadeInUp 0.6s ease', maxWidth: '900px', margin: '0 auto', width: '100%' },
  pageTitle: { fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--text-main)', borderLeft: '4px solid var(--primary)', paddingLeft: '12px', marginBottom: '10px' },
  successBanner: { padding: '14px 18px', backgroundColor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#16a34a', borderRadius: '12px', fontWeight: '700', fontSize: '14px', marginBottom: '20px' },
  sectionTitle: { fontSize: '13px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '15px', marginTop: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' },
  form: { backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '35px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' },
  formRow: { display: 'flex', gap: '25px', marginBottom: '20px' },
  formGroup: { flex: 1, display: 'flex', flexDirection: 'column' },
  label: { fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' },
  input: { padding: '12px 14px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontWeight: '500', transition: 'var(--transition-smooth)', outline: 'none', width: '100%', boxSizing: 'border-box' },
  formActions: { marginTop: '25px', display: 'flex', justifyContent: 'flex-end' },
  submitBtn: { padding: '14px 36px', fontSize: '14px', fontWeight: '700', backgroundColor: 'var(--primary)', color: 'var(--text-white)', border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)', transition: 'var(--transition-smooth)', letterSpacing: '0.5px' }
};
