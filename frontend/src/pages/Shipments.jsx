import { useState, useEffect } from 'react';
import { Truck, Plus, Package, Trash2, Edit2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Shipments() {
    const { user } = useAuth();
    const [shipments, setShipments] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ id: null, name: '' });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchShipments();
    }, []);

    const fetchShipments = async () => {
        try {
            const response = await api.get('/shipments');
            setShipments(response.data);
        } catch (error) {
            console.error('Failed to fetch shipments');
        }
    };

    const handleOpenModal = (shipment = null) => {
        if (shipment) {
            setIsEditing(true);
            setFormData({ id: shipment.id, name: shipment.name });
        } else {
            setIsEditing(false);
            setFormData({ id: null, name: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/shipments/${formData.id}`, { name: formData.name });
            } else {
                await api.post('/shipments', { name: formData.name });
            }
            setIsModalOpen(false);
            setFormData({ id: null, name: '' });
            fetchShipments();
        } catch (error) {
            alert('Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this shipment?')) return;
        try {
            await api.delete(`/shipments/${id}`);
            fetchShipments();
        } catch (error) {
            alert('Failed to delete shipment');
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/shipments/${id}/status`, status);
            fetchShipments();
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 0: return '#64748b'; // Planning
            case 1: return '#3b82f6'; // EnRoute
            case 2: return '#eab308'; // Arrived
            case 3: return '#22c55e'; // Completed
            default: return '#64748b';
        }
    };

    const statusLabels = ['Planning', 'En Route', 'Arrived', 'Completed'];

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h1 className="page-title">Shipments</h1>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={20} /> New Shipment
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {shipments.map(shipment => (
                    <div key={shipment.id} className="glass-panel" style={{ borderTop: `4px solid ${getStatusColor(shipment.status)}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{shipment.name}</h3>
                                <span style={{
                                    background: getStatusColor(shipment.status),
                                    color: 'white', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold',
                                    display: 'inline-block', marginTop: '0.5rem'
                                }}>
                                    {statusLabels[shipment.status]}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    className="btn"
                                    style={{ padding: '0.25rem', background: 'transparent', color: 'var(--text-muted)' }}
                                    onClick={() => handleOpenModal(shipment)}
                                >
                                    <Edit2 size={16} />
                                </button>
                                {user?.role === 'Admin' && (
                                    <button
                                        className="btn"
                                        style={{ padding: '0.25rem', background: 'transparent', color: 'red' }}
                                        onClick={() => handleDelete(shipment.id)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Package size={16} /> {shipment.packages?.length || 0} pkgs
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {shipment.status === 0 && (
                                <button className="btn" style={{ fontSize: '0.8rem', padding: '0.5rem', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }} onClick={() => updateStatus(shipment.id, 1)}>
                                    Start Ship
                                </button>
                            )}
                            {shipment.status === 1 && (
                                <button className="btn" style={{ fontSize: '0.8rem', padding: '0.5rem', background: 'rgba(234, 179, 8, 0.2)', color: '#fde047' }} onClick={() => updateStatus(shipment.id, 2)}>
                                    Arrive
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="glass-panel" style={{ width: '400px' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>{isEditing ? 'Edit Shipment' : 'Create Shipment'}</h2>
                        <form onSubmit={handleSubmit}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Shipment Name</label>
                            <input
                                autoFocus
                                required
                                className="input-field"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                style={{ marginBottom: '1.5rem' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button type="button" className="btn" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'white' }} onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {isEditing ? 'Save' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
