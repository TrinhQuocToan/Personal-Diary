import React from "react";
import { MdOutlineCancel } from "react-icons/md";
import { useWebSocket } from "../contexts/WebSocketContext";
import { useStateContext } from "../contexts/ContextProvider";

const Notification = () => {
  const { currentColor, setIsClicked, initialState } = useStateContext();
  const { notifications, removeNotification, clearNotifications } = useWebSocket();

  return (
    <div className="fixed inset-0 z-50 flex justify-end items-start pt-16">
      {/* Overlay để đóng modal khi click bên ngoài */}
      <div
        className="fixed inset-0 bg-black bg-opacity-25"
        onClick={() => setIsClicked({ ...initialState, notification: false })}
      />
      <div className="nav-item relative right-5 md:right-40 bg-white dark:bg-[#42464D] p-8 rounded-lg w-96">
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            <p className="font-semibold text-lg dark:text-gray-200">
              Notifications
            </p>
            <button
              type="button"
              className="text-white text-xs rounded p-1 px-2 bg-orange-theme"
            >
              {notifications.length > 0 ? `${notifications.length} New` : "No New"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsClicked({ ...initialState, notification: false })}
            className="text-2xl p-3 hover:drop-shadow-xl hover:bg-light-gray rounded-full"
            style={{ color: "rgb(153, 171, 180)" }}
          >
            <MdOutlineCancel />
          </button>
        </div>
        <div className="mt-5">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🔔</div>
              <p>Không có thông báo mới</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.map((notification, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border-b border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className={`rounded-full h-10 w-10 flex items-center justify-center text-white font-bold ${notification.type === 'new-report' ? 'bg-yellow-500' :
                    notification.type === 'item-removed' ? 'bg-red-500' :
                      notification.type === 'item-removed-admin' ? 'bg-green-500' : 'bg-blue-500'
                    }`}>
                    {notification.type === 'new-report' ? '🚨' :
                      notification.type === 'item-removed' ? '⚠️' :
                        notification.type === 'item-removed-admin' ? '✅' : 'ℹ️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold dark:text-gray-200 text-sm">
                        {notification.type === 'new-report' ? 'Báo cáo mới' :
                          notification.type === 'item-removed' ? 'Nội dung bị gỡ' :
                            notification.type === 'item-removed-admin' ? 'Đã xử lý báo cáo' : 'Thông báo'}
                      </p>
                      <button
                        onClick={() => removeNotification(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors text-sm"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-gray-600 text-sm dark:text-gray-400 mt-1">
                      {notification.message || notification.reason || 'Không có mô tả'}
                    </p>
                    {notification.timestamp && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.timestamp).toLocaleString('vi-VN')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {notifications.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <button
                className="w-full py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                onClick={clearNotifications}
              >
                Xóa tất cả thông báo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notification;
