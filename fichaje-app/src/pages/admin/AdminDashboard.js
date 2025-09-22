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
                    <button type="submit" className="action-btn edit-btn" disabled={isSaving}>
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

const HRManagerForm = ({ companies, onSave, onCancel, isSaving }) => {
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState('');
    const [fullName, setFullName] = useState('');
    const [companyId, setCompanyId] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!companyId) {
            alert('Por favor, seleccione una empresa.');
            return;
        }
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
                <div className="form-group">
                    <label>Empresa</label>
                    <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} required disabled={isSaving}>
                        <option value="" disabled>Seleccione una empresa</option>
                        {companies.map(company => (
                            <option key={company.id} value={company.id}>{company.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-actions">
                    <button type="submit" className="action-btn edit-btn" disabled={isSaving}>
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
            setCompanies(data);
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

    const handleCreateHRManager = async ({ email, pin, fullName, companyId }) => {
        setIsSaving(true);
        setError('');
        try {
            // Note: Creating users from the client-side requires the session to have elevated privileges,
            // or for table policies to be configured correctly. This might fail if permissions are not sufficient.
            // A more secure approach is to use a Supabase Edge Function.
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: email,
                password: pin,
                email_confirm: true, // Auto-confirm the email
            });

            if (authError) throw authError;

            const newUserId = authData.user.id;

            const { error: profileError } = await supabase.from('employees').insert([{
                id: newUserId,
                full_name: fullName,
                email: email,
                pin: pin,
                role: 'Gestor de RRHH',
                company_id: companyId
            }]);

            if (profileError) {
                // If profile creation fails, we should try to clean up the created auth user.
                await supabase.auth.admin.deleteUser(newUserId);
                throw profileError;
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
                    companies={companies}
                    onSave={handleCreateHRManager}
                    onCancel={() => setIsHRFormVisible(false)}
                    isSaving={isSaving}
                />
            )}

            <div className="hr-panel-header">
                <h1>Panel de Super Administrador</h1>
            </div>

            <div className="panel-section">
                <div className="hr-panel-header">
                    <h2>Gestión de Empresas</h2>
                    <button onClick={() => { setEditingCompany(null); setIsCompanyFormVisible(true); }} className="hr-panel-add-btn">+ Crear Empresa</button>
                </div>

                {loading && <p>Cargando empresas...</p>}
                {error && <p className="error-message">{error}</p>}

                {!loading && !error && (
                    <div className="table-container">
                        <table className="hr-panel-table">
                            <thead>
                                <tr>
                                    <th>Nombre de la Empresa</th>
                                    <th>Módulo de Clientes</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {companies.map(company => (
                                    <tr key={company.id}>
                                        <td>{company.name}</td>
                                        <td>{company.has_clients_module ? 'Activado' : 'Desactivado'}</td>
                                        <td>
                                            <button onClick={() => handleToggleModule(company)} className="action-btn edit-btn">
                                                {company.has_clients_module ? 'Desactivar Módulo' : 'Activar Módulo'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="panel-section">
                <div className="hr-panel-header">
                    <h2>Gestión de RRHH</h2>
                    <button onClick={() => setIsHRFormVisible(true)} className="hr-panel-add-btn">+ Crear Gestor RRHH</button>
                </div>
                 <p>Desde aquí puede crear nuevos gestores de RRHH y asignarlos a una empresa.</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
