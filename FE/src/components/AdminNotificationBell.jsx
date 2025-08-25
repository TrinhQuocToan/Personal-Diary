import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { RiNotification3Line } from 'react-icons/ri';
import { MdOutlineCancel } from 'react-icons/md';

const AdminNotificationBell = () => {
    const { notifications, removeNotification, clearNotifications } = useWebSocket();
    const [showNotifications, setShowNotifications] = useState(false);

    // Lọc chỉ những thông báo báo cáo mới
    const reportNotifications = notifications.filter(n => n.type === 'new-report');
    const unreadCount = reportNotifications.length;

    const handleNotificationClick = (notification) => {
        // Xóa thông báo khi click
        removeNotification(notifications.indexOf(notification));

        // Có thể mở modal chi tiết báo cáo ở đây
        console.log('Notification clicked:', notification);
    };

    return (
        <div className="relative">
            {/* Notification Bell */}
            <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
                <RiNotification3Line className="text-xl" />

                {/* Badge hiển thị số thông báo chưa đọc */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Thông báo báo cáo
                            </h3>
                            <div className="flex space-x-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={clearNotifications}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        Xóa tất cả
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowNotifications(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <MdOutlineCancel />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {unreadCount === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                Không có thông báo mới
                            </div>
                        ) : (
                            reportNotifications.map((notification, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleNotificationClick(notification)}
                                    className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                                <span className="text-red-600 text-sm">🚨</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(notification.timestamp).toLocaleString('vi-VN')}
                                            </p>
                                            {notification.report && (
                                                <div className="mt-2 text-xs text-gray-600">
                                                    <p><strong>Loại:</strong> {notification.report.itemType === 'post' ? 'Bài viết' : 'Bình luận'}</p>
                                                    <p><strong>Lý do:</strong> {notification.report.reason.replace('_', ' ')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {unreadCount > 0 && (
                        <div className="p-3 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => window.location.href = '/admin?tab=reports'}
                                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Xem tất cả báo cáo
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Overlay để đóng dropdown khi click bên ngoài */}
            {showNotifications && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                />
            )}
        </div>
    );
};

export default AdminNotificationBell;
