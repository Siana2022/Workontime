import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import PinModal from '../components/kiosk/PinModal';
import './Kiosk.css';

const Kiosk = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [lastClocking, setLastClocking] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        const fetchEmployees = async () => {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('role', 'Empleado'); // Only show employees on the kiosk, not HR managers

            if (error) {
                console.error('Error fetching employees:', error);
                setError('No se pudo cargar la lista de empleados.');
            } else {
                setEmployees(data);
            }
        };

        fetchEmployees();
        // Clear timer on component unmount
        return () => clearInterval(timer);
    }, []);

    const handleEmployeeClick = (employee) => {
        setSelectedEmployee(employee);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedEmployee(null);
    };

    // This function will be called from the modal on a successful clock-in
    const handleClockInSuccess = (clockInData) => {
        setLastClocking(clockInData);
        handleCloseModal();
        // Clear the confirmation message after 5 seconds
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
                <h1>Kiosko de Fichaje</h1>
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
                                alt={employee.name}
                                className="employee-avatar"
                            />
                            <span className="employee-name">{employee.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default Kiosk;
