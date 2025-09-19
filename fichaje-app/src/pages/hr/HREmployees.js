import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import './HRPanel.css';
import './HREmployees.css';

const EmployeeForm = ({ employee, schedules, clients, assignedClientIds, onSave, onCancel, isSaving, settings }) => {
    const [formData, setFormData] = useState(employee || {});
    const [avatarFile, setAvatarFile] = useState(null);
    const [selectedClients, setSelectedClients] = useState(new Set(assignedClientIds || []));

    useEffect(() => {
        const initialData = employee || { full_name: '', pin: '', role: 'Empleado', avatar_url: '', schedule_id: null, vacation_days: 22 };
        setFormData(initialData);
        setSelectedClients(new Set(assignedClientIds || []));
    }, [employee, assignedClientIds]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setAvatarFile(e.target.files[0]);
        }
    };

    const handleClientToggle = (clientId) => {
        const newSelection = new Set(selectedClients);
        if (newSelection.has(clientId)) {
            newSelection.delete(clientId);
        } else {
            newSelection.add(clientId);
        }
        setSelectedClients(newSelection);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData, avatarFile, Array.from(selectedClients));
    };

    return (
        <div className="form-overlay">
            <form className="employee-form" onSubmit={handleSubmit}>
                <h2>{employee ? 'Editar Empleado' : 'Añadir Empleado'}</h2>
                <div className="form-group">
                    <label htmlFor="employee-name">Nombre Completo</label>
                    <input type="text" id="employee-name" name="full_name" value={formData.full_name || ''} onChange={handleChange} required disabled={isSaving} />
                </div>
                <div className="form-group">
                    <label htmlFor="employee-pin">PIN (4 dígitos)</label>
                    <input type="password" id="employee-pin" name="pin" value={formData.pin || ''} onChange={handleChange} required maxLength="4" disabled={isSaving || !!employee} />
                </div>
                <div className="form-group">
                    <label htmlFor="employee-role">Rol</label>
                    <select id="employee-role" name="role" value={formData.role || 'Empleado'} onChange={handleChange} disabled={isSaving}>
                        <option value="Empleado">Empleado</option>
                        <option value="Gestor de RRHH">Gestor de RRHH</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="employee-schedule">Horario Asignado</label>
                    <select id="employee-schedule" name="schedule_id" value={formData.schedule_id || ''} onChange={handleChange} disabled={isSaving}>
                        <option value="">Sin Horario</option>
                        {schedules.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="employee-vacation">Días de Vacaciones Totales</label>
                    <input type="number" id="employee-vacation" name="vacation_days" value={formData.vacation_days || 22} onChange={handleChange} required disabled={isSaving} />
                </div>
                <div className="form-group">
                    <label htmlFor="employee-avatar">Avatar (Imagen)</label>
                    <input type="file" id="employee-avatar" name="avatar" onChange={handleFileChange} accept="image/*" disabled={isSaving} />
                </div>

                {settings?.has_clients_module && (
                    <div className="form-group client-assignment">
                        <label>Asignar Clientes</label>
                        <div className="checkbox-group">
                            {clients.map(client => (
                                <div key={client.id} className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        id={`client-${client.id}`}
                                        checked={selectedClients.has(client.id)}
                                        onChange={() => handleClientToggle(client.id)}
                                        disabled={isSaving}
                                    />
                                    <label htmlFor={`client-${client.id}`}>{client.name}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="form-actions">
                    <button type="submit" className="action-btn edit-btn" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar'}</button>
                    <button type="button" onClick={onCancel} disabled={isSaving}>Cancelar</button>
                </div>
            </form>
        </div>
    );
};


const HREmployees = () => {
    const { companyId, settings } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [clients, setClients] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchData = async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const [
                { data: employeesData, error: employeesError },
                { data: schedulesData, error: schedulesError },
                { data: clientsData, error: clientsError },
                { data: assignmentsData, error: assignmentsError }
            ] = await Promise.all([
                supabase.from('employees').select('*, schedule:schedules(name)').eq('company_id', companyId).order('full_name', { ascending: true }),
                supabase.from('schedules').select('*').eq('company_id', companyId).order('name', { ascending: true }),
                supabase.from('clients').select('*').eq('company_id', companyId).order('name', { ascending: true }),
                supabase.from('employee_client_assignments').select('*').eq('company_id', companyId)
            ]);

            if (employeesError || schedulesError || clientsError || assignmentsError) {
                throw employeesError || schedulesError || clientsError || assignmentsError;
            }

            const filteredEmployees = employeesData.filter(emp => emp.role !== 'Super Admin');

            const employeesWithAssignments = filteredEmployees.map(emp => ({
                ...emp,
                assigned_clients: assignmentsData
                    .filter(a => a.employee_id === emp.id)
                    .map(a => clientsData.find(c => c.id === a.client_id)?.name)
                    .filter(Boolean)
            }));

            setEmployees(employeesWithAssignments);
            setSchedules(schedulesData);
            setClients(clientsData);
            setAssignments(assignmentsData);
        } catch (err) {
            setError('No se pudieron cargar los datos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [companyId]);

    const handleAdd = () => {
        setEditingEmployee(null);
        setIsFormVisible(true);
    };

    const handleEdit = (employee) => {
        setEditingEmployee(employee);
        setIsFormVisible(true);
    };

    const handleDelete = async (employeeId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este empleado? Esta acción no se puede deshacer.')) {
            try {
                const { error } = await supabase.from('employees').delete().eq('id', employeeId).eq('company_id', companyId);
                if (error) throw error;
                fetchData();
            } catch (err) {
                setError(`Error al eliminar: ${err.message}`);
            }
        }
    };

    const handleSave = async (employeeData, avatarFile, assignedClientIds) => {
        setIsSaving(true);
        setError('');
        try {
            let avatarUrl = employeeData.avatar_url;
            if (avatarFile) {
                const filePath = `public/${companyId}/${Date.now()}-${avatarFile.name}`;
                const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile);
                if (uploadError) throw uploadError;
                avatarUrl = supabase.storage.from('avatars').getPublicUrl(filePath).data.publicUrl;
            }

            const { id, ...formData } = employeeData;
            const record = {
                ...formData,
                avatar_url: avatarUrl,
                schedule_id: formData.schedule_id || null,
                vacation_days: parseInt(formData.vacation_days, 10)
            };

            let savedEmployeeId = id;

            if (id) { // Update existing employee
                const { error } = await supabase.from('employees').update(record).eq('id', id).eq('company_id', companyId);
                if (error) throw error;
            } else { // Create new employee
                const { data, error } = await supabase.from('employees').insert([{ ...record, company_id: companyId }]).select().single();
                if (error) throw error;
                savedEmployeeId = data.id;
            }

            // Manage Client Assignments if the module is enabled
            if (settings?.has_clients_module) {
                const currentAssignments = assignments.filter(a => a.employee_id === savedEmployeeId).map(a => a.client_id);
                const newAssignments = new Set(assignedClientIds);

                const toAdd = assignedClientIds.filter(cid => !currentAssignments.includes(cid));
                const toRemove = currentAssignments.filter(cid => !newAssignments.has(cid));

                if (toAdd.length > 0) {
                    const newRecords = toAdd.map(client_id => ({ employee_id: savedEmployeeId, client_id, company_id: companyId }));
                    const { error } = await supabase.from('employee_client_assignments').insert(newRecords);
                    if (error) throw error;
                }

                if (toRemove.length > 0) {
                    const { error } = await supabase.from('employee_client_assignments').delete().eq('employee_id', savedEmployeeId).in('client_id', toRemove).eq('company_id', companyId);
                    if (error) throw error;
                }
            }

            setIsFormVisible(false);
            setEditingEmployee(null);
            fetchData();

        } catch (err) {
            setError(`Error al guardar: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsFormVisible(false);
        setEditingEmployee(null);
    };

    const assignedClientIds = editingEmployee ? assignments.filter(a => a.employee_id === editingEmployee.id).map(a => a.client_id) : [];

    return (
        <div className="hr-panel-container">
            {isFormVisible && <EmployeeForm employee={editingEmployee} schedules={schedules} clients={clients} assignedClientIds={assignedClientIds} onSave={handleSave} onCancel={handleCancel} isSaving={isSaving} settings={settings} />}
            <div className="hr-panel-header">
                <h1>Gestión de Empleados</h1>
                <button onClick={handleAdd} className="hr-panel-add-btn">+ Añadir Empleado</button>
            </div>

            {loading && <p>Cargando...</p>}
            {error && <p className="error-message">{error}</p>}

            {!loading && !error && (
                <div className="table-container">
                    <table className="hr-panel-table">
                        <thead>
                            <tr>
                                <th>Avatar</th>
                                <th>Nombre</th>
                                <th>Rol</th>
                                <th>Horario</th>
                                {settings?.has_clients_module && <th>Clientes Asignados</th>}
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(employee => (
                                <tr key={employee.id}>
                                    <td><img src={employee.avatar_url || `https://i.pravatar.cc/150?u=${employee.id}`} alt={employee.full_name} className="employee-table-avatar" /></td>
                                    <td>{employee.full_name}</td>
                                    <td>{employee.role}</td>
                                    <td>{employee.schedule?.name || 'Sin asignar'}</td>
                                    {settings?.has_clients_module && <td>{employee.assigned_clients.join(', ')}</td>}
                                    <td>
                                        <button onClick={() => handleEdit(employee)} className="action-btn edit-btn">Editar</button>
                                        <button onClick={() => handleDelete(employee.id)} className="action-btn delete-btn">Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default HREmployees;
