import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import './HRPanel.css';

const DepartmentForm = ({ department, onSave, onCancel, isSaving }) => {
    const [formData, setFormData] = useState(department || { name: '', manager_name: '' });

    useEffect(() => {
        setFormData(department || { name: '', manager_name: '' });
    }, [department]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="form-overlay">
            <form className="employee-form" onSubmit={handleSubmit}>
                <h2>{department ? 'Editar Departamento' : 'Añadir Departamento'}</h2>
                <div className="form-group">
                    <label>Nombre del Departamento</label>
                    <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required disabled={isSaving} />
                </div>
                <div className="form-group">
                    <label>Responsable (Nombre)</label>
                    <input type="text" name="manager_name" value={formData.manager_name || ''} onChange={handleChange} disabled={isSaving} />
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

const HRDepartments = () => {
    const { companyId } = useAuth();
    const [departments, setDepartments] = useState([]);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchData = async () => {
        if (!companyId) return;
        setLoading(true);
        setError('');
        try {
            const { data: departmentsData, error: departmentsError } = await supabase
                .from('departments')
                .select('*')
                .eq('company_id', companyId)
                .order('name', { ascending: true });

            if (departmentsError) throw departmentsError;

            const { data: employeesData, error: employeesError } = await supabase
                .from('employees')
                .select('department_id')
                .eq('company_id', companyId);

            if (employeesError) throw employeesError;

            const employeeCounts = employeesData.reduce((acc, emp) => {
                if (emp.department_id) {
                    acc[emp.department_id] = (acc[emp.department_id] || 0) + 1;
                }
                return acc;
            }, {});

            const departmentsWithCounts = departmentsData.map(dep => ({
                ...dep,
                employeeCount: employeeCounts[dep.id] || 0
            }));

            setDepartments(departmentsWithCounts);
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
        setEditingDepartment(null);
        setIsFormVisible(true);
    };

    const handleEdit = (department) => {
        setEditingDepartment(department);
        setIsFormVisible(true);
    };

    const handleDelete = async (departmentId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este departamento?')) {
            try {
                const { error } = await supabase.from('departments').delete().eq('id', departmentId).eq('company_id', companyId);
                if (error) throw error;
                fetchData();
            } catch (err) {
                setError(`Error al eliminar: ${err.message}`);
            }
        }
    };

    const handleSave = async (departmentData) => {
        setIsSaving(true);
        setError('');
        const { id, employeeCount, ...formData } = departmentData;
        try {
            if (id) {
                const { error } = await supabase.from('departments').update(formData).eq('id', id).eq('company_id', companyId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('departments').insert([{ ...formData, company_id: companyId }]);
                if (error) throw error;
            }
            setIsFormVisible(false);
            setEditingDepartment(null);
            fetchData();
        } catch (err) {
            setError(`Error al guardar: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsFormVisible(false);
        setEditingDepartment(null);
    };

    return (
        <div className="hr-panel-container">
            {isFormVisible && <DepartmentForm department={editingDepartment} onSave={handleSave} onCancel={handleCancel} isSaving={isSaving} />}
            <div className="hr-panel-header">
                <h1>Gestión de Departamentos</h1>
                <button onClick={handleAdd} className="hr-panel-add-btn">+ Añadir Departamento</button>
            </div>

            {loading && <p>Cargando...</p>}
            {error && <p className="error-message">{error}</p>}

            {!loading && !error && (
                <div className="table-container">
                    <table className="hr-panel-table">
                        <thead>
                            <tr>
                                <th>Nombre del Departamento</th>
                                <th>Responsable</th>
                                <th>Nº de Empleados</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departments.map(department => (
                                <tr key={department.id}>
                                    <td>{department.name}</td>
                                    <td>{department.manager_name || 'Sin asignar'}</td>
                                    <td>{department.employeeCount}</td>
                                    <td>
                                        <button onClick={() => handleEdit(department)} className="action-btn edit-btn">Editar</button>
                                        <button onClick={() => handleDelete(department.id)} className="action-btn delete-btn">Eliminar</button>
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

export default HRDepartments;
