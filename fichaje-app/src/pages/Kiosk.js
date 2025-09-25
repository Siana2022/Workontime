import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PinModal from '../components/kiosk/PinModal';
import './Kiosk.css';

const Kiosk = () => {
    const [searchParams] = useSearchParams();
    const companyName = searchParams.get('empresa');

    const [currentTime, setCurrentTime] = useState(new Date());
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [lastClocking, setLastClocking] = useState(null);
    const [companyDisplayName, setCompanyDisplayName] = useState('');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        const fetchKioskData = async () => {
            setError('');
            setEmployees([]);
            setCompanyDisplayName('');

            if (!companyName) {
                setError('URL inválida. Por favor, especifique el nombre de la empresa en la URL (ej: /kiosk?empresa=SuEmpresa).');
                return;
            }

            // 1. Find the company ID from the name
            const { data: companyData, error: companyError } = await supabase
                .from('companies')
                .select('id, name')
                .eq('name', companyName)
                .single();

            if (companyError || !companyData) {
                console.error('Error fetching company:', companyError);
                setError(`No se encontró ninguna empresa con el nombre "${companyName}".`);
                return;
            }

            const companyId = companyData.id;
            setCompanyDisplayName(companyData.name);

            // 2. Fetch employees for that company
            const { data, error: employeesError } = await supabase
                .from('employees')
                .select('*')
                .eq('role', 'Empleado')
                .eq('company_id', companyId)
                .order('full_name', { ascending: true });

            if (employeesError) {
                console.error('Error fetching employees:', employeesError);
                setError('No se pudo cargar la lista de empleados.');
            } else {
                setEmployees(data);
            }
        };

        fetchKioskData();
        return () => clearInterval(timer);
    }, [companyName]);

    const handleEmployeeClick = (employee) => {
        setSelectedEmployee(employee);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedEmployee(null);
    };

    const handleClockInSuccess = (clockInData) => {
        setLastClocking(clockInData);
        handleCloseModal();
        setTimeout(() => setLastClocking(null), 5000);
    };

    return (
        <>
            {isModalOpen && (
                <PinModal
                    employee={selectedEmployee}
                    onClose={handleCloseModal}
                    onSuccess={handleClockInSuccess}
                />
            )}
            <div className="kiosk-container">
                <h1>Kiosko de Fichaje {companyDisplayName && `- ${companyDisplayName}`}</h1>
                <div className="current-time-kiosk">
                    {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    {' - '}
                    {currentTime.toLocaleTimeString('es-ES')}
                </div>

                {error && <p className="error-message">{error}</p>}

                {lastClocking && (
                    <div className="kiosk-confirmation">
                        ¡Gracias, {lastClocking.name}! Fichaje de <strong>{lastClocking.type}</strong> registrado a las {lastClocking.time.toLocaleTimeString('es-ES')}.
                    </div>
                )}

                <div className="employee-grid">
                    {employees.map(employee => (
                        <div
                            key={employee.id}
                            className="employee-card"
                            onClick={() => handleEmployeeClick(employee)}
                        >
                            <img
                                src={employee.avatar_url || `https://i.pravatar.cc/150?u=${employee.id}`}
                                alt={employee.full_name}
                                className="employee-avatar"
                            />
                            <span className="employee-name">{employee.full_name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default Kiosk;