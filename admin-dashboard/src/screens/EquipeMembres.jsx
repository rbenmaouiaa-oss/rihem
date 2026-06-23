import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import Sidebar from '../Sidebar';

export default function EquipeMembres() {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);

  useEffect(() => {
    if (teamId) fetchData();
  }, [teamId]);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: tData } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId);

      setTeam(tData && tData.length > 0 ? tData[0] : null);

      const { data: mData } = await supabase
        .from('team_members')
        .select('*, users(*)')
        .eq('team_id', teamId);

      setMembers(mData || []);

      const { data: uData } = await supabase
        .from('users')
        .select('*');

      setAllUsers(uData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const availableUsers = allUsers.filter(
    (u) => !members.some((m) => m.user_id === u.id)
  );

  async function handleAddMember() {
    if (!selectedUserId) return;
    setAdding(true);
    try {
      await supabase.from('team_members').insert({ team_id: teamId, user_id: selectedUserId });
      setSelectedUserId('');
      setShowAddModal(false);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveMember(userId) {
    setRemovingId(userId);
    try {
      await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);
      setConfirmRemove(null);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingId(null);
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
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40 }}>Chargement...</p>
          ) : (
            <>
              <div style={styles.teamHeader}>
                <div>
                  <h3 style={styles.teamName}>{team?.name || 'Équipe'}</h3>
                  <p style={styles.teamDesc}>{team?.description || ''}</p>
                </div>
                <div style={styles.memberBadge}>
                  <span style={styles.memberCount}>{members.length}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>membre{members.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <div style={styles.actionsRow}>
                <h3 style={styles.sectionTitle}>MEMBRES DE L'ÉQUIPE</h3>
                <button style={styles.addBtn} onClick={() => setShowAddModal(true)}>+ Ajouter un membre</button>
              </div>

              <div style={styles.membersList}>
                {members.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 20 }}>Aucun membre dans cette équipe.</p>
                ) : (
                  members.map((m) => {
                    const user = m.users || {};
                    const initials = (user.name || user.email || '?').charAt(0).toUpperCase();
                    return (
                      <div key={m.id} style={styles.memberRow}>
                        <div style={styles.memberLeft}>
                          <div style={styles.memberAvatar}>{initials}</div>
                          <div>
                            <div style={styles.memberName}>{user.name || '—'}</div>
                            <div style={styles.memberEmail}>{user.email || '—'}</div>
                          </div>
                        </div>
                        <div style={styles.memberCenter}>
                          <span style={styles.memberRole}>{user.role || '—'}</span>
                          <span style={styles.memberDept}>{user.department || '—'}</span>
                        </div>
                        <div style={styles.memberRight}>
                          <button
                            style={styles.removeBtn}
                            disabled={removingId === user.id}
                            onClick={() => setConfirmRemove(user.id)}
                          >
                            {removingId === user.id ? '...' : 'Retirer'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {showAddModal && (
        <div style={styles.overlay} onClick={() => { if (!adding) setShowAddModal(false); }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Ajouter un membre</h3>
            <select
              style={styles.select}
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">-- Sélectionnez un employé --</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name || u.email}</option>
              ))}
            </select>
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setShowAddModal(false)} disabled={adding}>Annuler</button>
              <button style={styles.confirmBtn} onClick={handleAddMember} disabled={!selectedUserId || adding}>
                {adding ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmRemove !== null && (
        <div style={styles.overlay} onClick={() => setConfirmRemove(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Confirmer le retrait</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Êtes-vous sûr de vouloir retirer ce membre de l'équipe ?</p>
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setConfirmRemove(null)}>Annuler</button>
              <button style={styles.confirmBtnDanger} onClick={() => handleRemoveMember(confirmRemove)}>
                {removingId === confirmRemove ? '...' : 'Retirer'}
              </button>
            </div>
          </div>
        </div>
      )}
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
  content: { padding: '40px', animation: 'fadeInUp 0.6s ease' },
  teamHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', padding: '25px', backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' },
  teamName: { fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', fontFamily: 'var(--font-heading)', margin: 0 },
  teamDesc: { fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px', margin: '6px 0 0 0' },
  memberBadge: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '12px 20px', backgroundColor: 'var(--primary-light)', borderRadius: '12px', minWidth: '80px' },
  memberCount: { fontSize: '32px', fontWeight: '800', color: 'var(--primary)', fontFamily: 'var(--font-heading)', lineHeight: 1 },
  actionsRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle: { fontSize: '18px', color: 'var(--text-main)', fontWeight: '700', fontFamily: 'var(--font-heading)', borderLeft: '4px solid var(--primary)', paddingLeft: '12px', margin: 0 },
  addBtn: { padding: '10px 22px', fontSize: '13px', fontWeight: '700', backgroundColor: 'var(--primary)', color: 'var(--text-white)', border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)', transition: 'var(--transition-smooth)' },
  membersList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  memberRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', transition: 'var(--transition-smooth)' },
  memberLeft: { display: 'flex', alignItems: 'center', gap: '14px', flex: 2 },
  memberAvatar: { width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px' },
  memberName: { fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' },
  memberEmail: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' },
  memberCenter: { flex: 2, display: 'flex', gap: '20px', alignItems: 'center' },
  memberRole: { fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', padding: '4px 10px', backgroundColor: 'var(--bg-app)', borderRadius: '6px' },
  memberDept: { fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' },
  memberRight: { flex: 1, textAlign: 'right' },
  removeBtn: { padding: '8px 18px', fontSize: '12px', fontWeight: '700', backgroundColor: 'transparent', color: 'var(--danger)', border: '1.5px solid var(--danger)', borderRadius: '8px', cursor: 'pointer', transition: 'var(--transition-smooth)' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '30px', width: '420px', maxWidth: '90%', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalTitle: { fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-heading)', marginBottom: '20px' },
  select: { width: '100%', padding: '12px 14px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '10px', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', marginBottom: '20px', outline: 'none' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
  cancelBtn: { padding: '10px 20px', fontSize: '13px', fontWeight: '600', backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' },
  confirmBtn: { padding: '10px 20px', fontSize: '13px', fontWeight: '700', backgroundColor: 'var(--primary)', color: 'var(--text-white)', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  confirmBtnDanger: { padding: '10px 20px', fontSize: '13px', fontWeight: '700', backgroundColor: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
};
