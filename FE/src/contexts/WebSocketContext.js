import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const WebSocketContext = createContext();

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};

export const WebSocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Khởi tạo WebSocket connection
        const newSocket = io('http://localhost:9999');

        newSocket.on('connect', () => {
            console.log('🔌 WebSocket connected');
            setIsConnected(true);

            // Join admin room nếu user là admin
            const token = localStorage.getItem('accessToken');
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    if (payload.role === 'admin') {
                        newSocket.emit('join-admin');
                        console.log('👑 Admin joined admin room');
                    }
                } catch (error) {
                    console.error('Error parsing token:', error);
                }
            }

            // Join user room
            const userId = localStorage.getItem('userId');
            if (userId) {
                newSocket.emit('join-user', userId);
                console.log(`👤 User ${userId} joined user room`);
            }
        });

        newSocket.on('disconnect', () => {
            console.log('🔌 WebSocket disconnected');
            setIsConnected(false);
        });

        // Lắng nghe thông báo mới cho admin
        newSocket.on('new-report', (data) => {
            console.log('🚨 New report notification:', data);
            setNotifications(prev => [data, ...prev]);

            // Hiển thị toast notification
            if (data.type === 'new-report') {
                showToast('🚨 Báo cáo mới', data.message, 'warning');
            }
        });

        // Lắng nghe thông báo item bị gỡ
        newSocket.on('item-removed-admin', (data) => {
            console.log('🗑️ Item removed notification:', data);
            setNotifications(prev => [data, ...prev]);

            if (data.type === 'item-removed-admin') {
                showToast('🗑️ Nội dung đã bị gỡ', data.message, 'success');
            }
        });

        // Lắng nghe thông báo cho user
        newSocket.on('item-removed', (data) => {
            console.log('⚠️ Item removed notification for user:', data);
            setNotifications(prev => [data, ...prev]);

            if (data.type === 'item-removed') {
                showToast('⚠️ Nội dung bị gỡ', `${data.itemTitle} đã bị gỡ khỏi cộng đồng`, 'error');
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    // Function hiển thị toast notification
    const showToast = (title, message, type = 'info') => {
        // Tạo toast element
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;

        // Style dựa trên type
        const styles = {
            info: 'bg-blue-500 text-white',
            success: 'bg-green-500 text-white',
            warning: 'bg-yellow-500 text-white',
            error: 'bg-red-500 text-white'
        };

        toast.className += ` ${styles[type]}`;

        toast.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <h4 class="font-semibold">${title}</h4>
          <p class="text-sm opacity-90">${message}</p>
        </div>
        <button class="ml-4 text-white opacity-70 hover:opacity-100" onclick="this.parentElement.parentElement.remove()">
          ×
        </button>
      </div>
    `;

        document.body.appendChild(toast);

        // Hiển thị toast
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);

        // Tự động ẩn sau 5 giây
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }, 5000);
    };

    // Function gửi thông báo
    const emit = (event, data) => {
        if (socket) {
            socket.emit(event, data);
        }
    };

    // Function xóa thông báo
    const removeNotification = (index) => {
        setNotifications(prev => prev.filter((_, i) => i !== index));
    };

    // Function xóa tất cả thông báo
    const clearNotifications = () => {
        setNotifications([]);
    };

    const value = {
        socket,
        isConnected,
        notifications,
        emit,
        removeNotification,
        clearNotifications,
        showToast
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};
