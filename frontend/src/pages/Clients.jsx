import { useState, useEffect } from 'react';
import { Plus, Search, User, Trash2, Edit2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Clients() {
    const { user } = useAuth();
    const [clients, setClients] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ id: null, name: '', phone: '', chatId: '' });
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const response = await api.get('/clients');
            setClients(response.data);
        } catch (error) {
            console.error('Failed to fetch clients', error);
        }
    };

    const handleOpenModal = (client = null) => {
        if (client) {
            setIsEditing(true);
            setFormData({ id: client.id, name: client.name, phone: client.phone, chatId: client.chatId || '' });
        } else {
            setIsEditing(false);
            setFormData({ id: null, name: '', phone: '', chatId: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEditing) {
                await api.put(`/clients/${formData.id}`, formData);
            } else {
                await api.post('/clients/register', formData);
            }
            setIsModalOpen(false);
            setFormData({ id: null, name: '', phone: '', chatId: '' });
            fetchClients();
        } catch (error) {
            alert('Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this client?')) return;
        try {
            await api.delete(`/clients/${id}`);
            fetchClients();
        } catch (error) {
            alert('Failed to delete user');
        }
    };

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Clients</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Manage registered clients and generate IDs.</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={20} />
                    Register Client
                </button>
            </div>

            <div className="glass-panel">
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search by Name or ID..."
                            className="input-field"
                            style={{ paddingLeft: '2.5rem' }}
                        />
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                    <thead>
                        <tr style={{ color: 'var(--text-muted)', textAlign: 'left', fontSize: '0.875rem' }}>
                            <th style={{ padding: '0 1rem' }}>ID</th>
                            <th style={{ padding: '0 1rem' }}>Name</th>
                            <th style={{ padding: '0 1rem' }}>Phone</th>
                            <th style={{ padding: '0 1rem' }}>Chat ID</th>
                            <th style={{ padding: '0 1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    No clients found.
                                </td>
                            </tr>
                        ) : (
                            clients.map(client => (
                                <tr key={client.id} style={{ background: 'rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: '1rem', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px', fontWeight: 'bold', color: 'var(--primary)' }}>
                                        {client.humanId}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <User size={16} color="var(--primary)" />
                                            </div>
                                            {client.name}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>{client.phone}</td>
                                    <td style={{ padding: '1rem' }}>
                                        {client.chatId || '-'}
                                    </td>
                                    <td style={{ padding: '1rem', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="btn"
                                                style={{ padding: '0.25rem', background: 'transparent', color: 'var(--text-muted)' }}
                                                onClick={() => handleOpenModal(client)}
                                            >
                                                <Edit2 size={16} />
                                            </button>

                                            {user?.role === 'Admin' && (
                                                <button
                                                    className="btn"
                                                    style={{ padding: '0.25rem', background: 'transparent', color: 'red' }}
                                                    onClick={() => handleDelete(client.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="glass-panel" style={{ width: '400px' }}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>{isEditing ? 'Edit Client' : 'New Client'}</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Full Name</label>
                                <input
                                    required
                                    className="input-field"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Phone Number</label>
                                <input
                                    required
                                    className="input-field"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Telegram Chat ID</label>
                                <input
                                    className="input-field"
                                    value={formData.chatId}
                                    onChange={e => setFormData({ ...formData, chatId: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" className="btn" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'white' }} onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
