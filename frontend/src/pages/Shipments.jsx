import { useState, useEffect } from 'react';
import { Truck, Plus, Package, Trash2, Edit2, Eye, X, CheckSquare, Square } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Shipments() {
    const { user } = useAuth();
    const [shipments, setShipments] = useState([]);

    // Create/Edit Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ id: null, name: '' });
    const [isEditing, setIsEditing] = useState(false);

    // Validating Shipment Creation
    const [availablePackages, setAvailablePackages] = useState([]);
    const [selectedPackageIds, setSelectedPackageIds] = useState([]);

    // Package List Modal
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [selectedShipment, setSelectedShipment] = useState(null);

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

    const fetchAvailablePackages = async (currentShipmentId = null) => {
        try {
            const response = await api.get('/packages');
            // Show packages that are NOT assigned OR are assigned to THIS shipment (if editing)
            const available = response.data.filter(p => !p.shipmentId || p.shipmentId === currentShipmentId);
            setAvailablePackages(available);
        } catch (error) {
            console.error('Failed to fetch packages');
        }
    };

    const handleOpenModal = (shipment = null) => {
        if (shipment) {
            setIsEditing(true);
            setFormData({ id: shipment.id, name: shipment.name });
            // Pre-select packages currently in this shipment
            const currentPkgIds = shipment.packages ? shipment.packages.map(p => p.id) : [];
            setSelectedPackageIds(currentPkgIds);
            // Fetch available + current
            fetchAvailablePackages(shipment.id);
        } else {
            setIsEditing(false);
            setFormData({ id: null, name: '' });
            setSelectedPackageIds([]);
            fetchAvailablePackages(null);
        }
        setIsModalOpen(true);
    };

    const handleTogglePackage = (pkgId) => {
        setSelectedPackageIds(prev =>
            prev.includes(pkgId)
                ? prev.filter(id => id !== pkgId)
                : [...prev, pkgId]
        );
    };

    const getSelectedTotals = () => {
        const selected = availablePackages.filter(p => selectedPackageIds.includes(p.id));
        const totalWeight = selected.reduce((sum, p) => sum + p.weight, 0);
        const totalVolume = selected.reduce((sum, p) => sum + p.volume, 0);
        return { totalWeight, totalVolume };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                packageIds: selectedPackageIds
            };

            if (isEditing) {
                await api.put(`/shipments/${formData.id}`, payload);
            } else {
                await api.post('/shipments', payload);
            }
            setIsModalOpen(false);
            setFormData({ id: null, name: '' });
            setSelectedPackageIds([]);
            fetchShipments();
        } catch (error) {
            console.error(error);
            let msg = 'Operation failed';
            if (error.response) {
                if (typeof error.response.data === 'string') {
                    msg += `: ${error.response.data}`;
                } else if (error.response.data?.title) {
                    msg += `: ${error.response.data.title}`;
                } else if (error.response.data?.message) {
                    msg += `: ${error.response.data.message}`;
                } else if (error.response.data?.errors) {
                    msg += `: ${JSON.stringify(error.response.data.errors)}`;
                }
            }
            alert(msg);
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

    const handleViewPackages = (shipment) => {
        setSelectedShipment(shipment);
        setIsPackageModalOpen(true);
    };

    const handleAddPackageByCode = async (e) => {
        e.preventDefault();
        const code = e.target.elements.trackingCode.value;
        if (!code) return;

        try {
            await api.post(`/shipments/${selectedShipment.id}/add-package-by-code`, JSON.stringify(code), {
                headers: { 'Content-Type': 'application/json' }
            });
            e.target.reset();
            const response = await api.get('/shipments');
            setShipments(response.data);
            const updated = response.data.find(s => s.id === selectedShipment.id);
            setSelectedShipment(updated);
        } catch (error) {
            let msg = 'Failed to add package';
            if (error.response?.data?.message) msg += `: ${error.response.data.message}`;
            alert(msg);
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
                <h1 className="page-title">Shipments (Containers)</h1>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={20} /> New Shipment
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {shipments.map(shipment => (
                    <div key={shipment.id} className="glass-panel" style={{ borderTop: `4px solid ${getStatusColor(shipment.status)}`, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{shipment.name}</h3>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                    <span style={{
                                        background: getStatusColor(shipment.status),
                                        color: 'white', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold'
                                    }}>
                                        {statusLabels[shipment.status]}
                                    </span>
                                    {shipment.departureDate && (
                                        <span style={{
                                            background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa',
                                            padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500'
                                        }}>
                                            Sent: {new Date(shipment.departureDate).toLocaleDateString()}
                                        </span>
                                    )}
                                    {shipment.arrivalDate && (
                                        <span style={{
                                            background: 'rgba(234, 179, 8, 0.2)', color: '#fde047',
                                            padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500'
                                        }}>
                                            Arrived: {new Date(shipment.arrivalDate).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    className="btn"
                                    style={{ padding: '0.25rem', background: 'transparent', color: 'var(--text-muted)' }}
                                    onClick={() => handleViewPackages(shipment)}
                                    title="View Packages"
                                >
                                    <Eye size={16} />
                                </button>
                                <button
                                    className="btn"
                                    style={{ padding: '0.25rem', background: 'transparent', color: 'var(--text-muted)' }}
                                    onClick={() => handleOpenModal(shipment)}
                                    title="Edit Shipment"
                                >
                                    <Edit2 size={16} />
                                </button>
                                {user?.role === 'Admin' && (
                                    <button
                                        className="btn"
                                        style={{ padding: '0.25rem', background: 'transparent', color: 'red' }}
                                        onClick={() => handleDelete(shipment.id)}
                                        title="Delete Shipment"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0' }}>
                                <Package size={16} />
                                <strong>{shipment.packages?.length || 0}</strong> packages
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0' }}>
                                <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{shipment.totalWeight}kg</span>
                                <span style={{ opacity: 0.5 }}>|</span>
                                <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{shipment.totalVolume}m³</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                            {shipment.status === 0 && (
                                <button className="btn" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', justifyContent: 'center' }} onClick={() => updateStatus(shipment.id, 1)}>
                                    Start Ship
                                </button>
                            )}
                            {shipment.status === 1 && (
                                <button className="btn" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem', background: 'rgba(234, 179, 8, 0.2)', color: '#fde047', justifyContent: 'center' }} onClick={() => updateStatus(shipment.id, 2)}>
                                    Arrive
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="glass-panel" style={{ width: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>{isEditing ? 'Edit Shipment' : 'Create Shipment (Container)'}</h2>

                        <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Shipment Name</label>
                                <input
                                    autoFocus
                                    required
                                    className="input-field"
                                    value={formData.name}
                                    placeholder="e.g. PKG-2026-001"
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <label>Select Parcels</label>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                                        Selected: {getSelectedTotals().totalWeight.toFixed(1)}kg / {getSelectedTotals().totalVolume.toFixed(2)}m³
                                    </span>
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}>
                                    {availablePackages.length === 0 ? (
                                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No parcels available.</p>
                                    ) : (
                                        availablePackages.map(pkg => (
                                            <div key={pkg.id}
                                                onClick={() => handleTogglePackage(pkg.id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem',
                                                    borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer',
                                                    background: selectedPackageIds.includes(pkg.id) ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                                                }}
                                            >
                                                {selectedPackageIds.includes(pkg.id) ? <CheckSquare size={18} color="var(--primary)" /> : <Square size={18} color="var(--text-muted)" />}
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '500' }}>{pkg.trackingCode}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pkg.client?.humanId} | {pkg.weight}kg | {pkg.volume}m³ | ${pkg.price}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: 'auto' }}>
                                <button type="button" className="btn" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'white' }} onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {isEditing ? 'Save Changes' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Packages Modal */}
            {isPackageModalOpen && selectedShipment && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1010
                }}>
                    <div className="glass-panel" style={{ width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem' }}>{selectedShipment.name}</h2>
                                <p style={{ color: 'var(--text-muted)' }}>Package Manifest</p>
                            </div>
                            <button onClick={() => setIsPackageModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        {selectedShipment.status === 0 && (
                            <form onSubmit={handleAddPackageByCode} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                                <input
                                    name="trackingCode"
                                    className="input-field"
                                    placeholder="Scan Tracking Code..."
                                    style={{ flex: 1, fontFamily: 'monospace' }}
                                    autoFocus
                                    autoComplete="off"
                                />
                                <button type="submit" className="btn btn-primary">Add</button>
                            </form>
                        )}

                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {selectedShipment.packages && selectedShipment.packages.length > 0 ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: '#1e293b' }}>
                                        <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                            <th style={{ padding: '0.75rem' }}>Tracking Code</th>
                                            <th style={{ padding: '0.75rem' }}>Weight</th>
                                            <th style={{ padding: '0.75rem' }}>Volume</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedShipment.packages.map(pkg => (
                                            <tr key={pkg.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: 'var(--text-main)' }}>{pkg.trackingCode}</td>
                                                <td style={{ padding: '0.75rem' }}>{pkg.weight} kg</td>
                                                <td style={{ padding: '0.75rem' }}>{pkg.volume} m³</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No packages in this shipment.</p>
                            )}
                        </div>

                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            Total Packages: <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{selectedShipment.packages?.length || 0}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
