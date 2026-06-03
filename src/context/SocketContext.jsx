import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '../config/api';

const SocketContext = createContext(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const parsedUrl = new URL(API_BASE_URL);
        const socketUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;

        const newSocket = io(socketUrl, {
            auth: { token }
        });

        newSocket.on('connect', () => {
            console.log('Connected to real-time notification server');
        });

        newSocket.on('new_notification', (notification) => {
            console.log('Real-time notification received:', notification);
            toast.info(`🔔 ${notification.title}: ${notification.message}`, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
            // We can dispatch a custom event so other components (like NotificationBell) can listen without polling
            window.dispatchEvent(new CustomEvent('new_notification', { detail: notification }));
        });

        // Broadcast events for data synchronization
        newSocket.on('REFRESH_LEAVES', (data) => {
            window.dispatchEvent(new CustomEvent('REFRESH_LEAVES', { detail: data }));
        });
        
        newSocket.on('REFRESH_EMPLOYEES', (data) => {
            window.dispatchEvent(new CustomEvent('REFRESH_EMPLOYEES', { detail: data }));
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
