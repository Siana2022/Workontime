import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './AdminDashboard.css';

const CompanyForm = ({ company, onSave, onCancel, isSaving }) => {
    const [name, setName] = useState(company ? company.name : '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...company, name });
    };

    return (
        <div className="form-overlay">
            <form className="employee-form" onSubmit={handleSubmit}>
                <h2>{company ? 'Editar Empresa' : 'Crear Nueva Empresa'}</h2>
                <div className="form-group">
                    <label>Nombre de la Empresa</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSaving} />
                </div>
                <div className="form-actions">
                    <button type="submit" className="action-btn save-btn" disabled={isSaving}>
                        {isSaving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button type="button" onClick={onCancel} disabled={isSaving}>
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

const HRManagerForm = ({ companyId, onSave, onCancel, isSaving }) => {
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState('');
    const [fullName, setFullName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ email, pin, fullName, companyId });
    };

    return (
        <div className="form-overlay">
            <form className="employee-form" onSubmit={handleSubmit}>
                <h2>Crear Nuevo Gestor de RRHH</h2>
                <div className="form-group">
                    <label>Nombre Completo</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={isSaving} />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isSaving} />
                </div>
                <div className="form-group">
                    <label>PIN (Contraseña)</label>
                    <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} required disabled={isSaving} />
                </div>
                <div className="form-actions">
                    <button type="submit" className="action-btn save-btn" disabled={isSaving}>
                        {isSaving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button type="button" onClick={onCancel} disabled={isSaving}>
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};


const AdminDashboard = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCompanyFormVisible, setIsCompanyFormVisible] = useState(false);
    const [isHRFormVisible, setIsHRFormVisible] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [targetCompanyId, setTargetCompanyId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchCompanies = async () => {
        setLoading(true);
        setError('');
        try {
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setCompanies(data || []);
        } catch (err) {
            setError('No se pudieron cargar las empresas.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleToggleModule = async (company) => {
        try {
            const { error } = await supabase
                .from('companies')
                .update({ has_clients_module: !company.has_clients_module })
                .eq('id', company.id);

            if (error) throw error;
            fetchCompanies();
        } catch (err) {
            setError(`Error al actualizar el módulo: ${err.message}`);
        }
    };

    const handleSaveCompany = async (companyData) => {
        setIsSaving(true);
        try {
            const { error } = await supabase.from('companies').insert([{ name: companyData.name }]);
            if (error) throw error;

            setIsCompanyFormVisible(false);
            fetchCompanies();
        } catch (err) {
            setError(`Error al crear la empresa: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteCompany = async (companyId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta empresa? Esta acción no se puede deshacer.')) {
            try {
                const { error } = await supabase.from('companies').delete().eq('id', companyId);
                if (error) throw error;
                fetchCompanies();
            } catch (err) {
                setError(`Error al eliminar la empresa: ${err.message}`);
            }
        }
    };

    const handleCreateHRManager = async ({ email, pin, fullName, companyId }) => {
        setIsSaving(true);
        setError('');
        try {
            const { data, error } = await supabase.functions.invoke('create-employee', {
                body: { email, password: pin, fullName, companyId, role: 'Gestor de RRHH' },
            });

            if (error) throw error;

            if (data.error) {
                throw new Error(data.error);
            }

            alert('¡Gestor de RRHH creado con éxito!');
            setIsHRFormVisible(false);

        } catch (err) {
            setError(`Error al crear el gestor de RRHH: ${err.message}`);
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const openHRForm = (companyId) => {
        setTargetCompanyId(companyId);
        setIsHRFormVisible(true);
    };

    return (
        <div className="admin-dashboard-container">
            {isCompanyFormVisible && (
                <CompanyForm
                    company={editingCompany}
                    onSave={handleSaveCompany}
                    onCancel={() => setIsCompanyFormVisible(false)}
                    isSaving={isSaving}
                />
            )}
            {isHRFormVisible && (
                <HRManagerForm
                    companyId={targetCompanyId}
                    onSave={handleCreateHRManager}
                    onCancel={() => setIsHRFormVisible(false)}
                    isSaving={isSaving}
                />
            )}

            <div className="hr-panel-header">
                <h1>Panel de Super Admin</h1>
                <button onClick={() => { setEditingCompany(null); setIsCompanyFormVisible(true); }} className="hr-panel-add-btn">Añadir Empresa</button>
            </div>

            <div className="panel-section">
                {loading && <p>Cargando empresas...</p>}
                {error && <p className="error-message">{error}</p>}

                {!loading && !error && (
                    <div className="table-container">
                        <table className="hr-panel-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre de la Empresa</th>
                                    <th>Módulo Clientes</th>
                                    <th>Fecha de Creación</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.isArray(companies) && companies.map(company => (
                                    <tr key={company.id}>
                                        <td>{company.id}</td>
                                        <td>{company.name}</td>
                                        <td>
                                            <span className={`status-pill ${company.has_clients_module ? 'status-active' : 'status-inactive'}`}>
                                                {company.has_clients_module ? 'Activado' : 'Desactivado'}
                                            </span>
                                        </td>
                                        <td>{new Date(company.created_at).toLocaleDateString()}</td>
                                        <td className="actions-cell">
                                            <button onClick={() => handleToggleModule(company)} className="action-btn">
                                                {company.has_clients_module ? 'Desactivar' : 'Activar'}
                                            </button>
                                            <button onClick={() => openHRForm(company.id)} className="action-btn">Añadir Gestor RRHH</button>
                                            <button onClick={() => handleDeleteCompany(company.id)} className="action-btn delete-btn">Eliminar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
