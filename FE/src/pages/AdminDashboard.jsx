import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from './Authentication/helper/axiosInstance';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedItem, setSelectedItem] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'user', 'post', 'report'

    // States cho các popup
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedUserForRole, setSelectedUserForRole] = useState(null);
    const [selectedReportForStatus, setSelectedReportForStatus] = useState(null);
    const [newRole, setNewRole] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [adminNotes, setAdminNotes] = useState('');

    const navigate = useNavigate();



    useEffect(() => {
        // Check admin role first
        if (checkAdminRole()) {
            fetchDashboardStats();
            fetchUsers();
            fetchPosts();
            fetchReports();
        }
    }, []);

    // Check if user is admin
    const checkAdminRole = () => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                navigate("/login");
                return false;
            }

            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            if (tokenPayload.role !== 'admin') {
                navigate("/");
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error checking admin role:', error);
            navigate("/login");
            return false;
        }
    };

    // Handle URL parameters for tabs
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['dashboard', 'users', 'posts'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const fetchDashboardStats = async () => {
        if (!checkAdminRole()) return;

        try {
            const response = await axiosInstance.get('/api/admin/dashboard/stats');
            setStats(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate("/login");
            }
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        if (!checkAdminRole()) return;

        try {
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10,
                search: searchTerm,
                role: selectedRole
            });

            const response = await axiosInstance.get(`/api/admin/users?${params}`);
            setUsers(response.data.users);
        } catch (error) {
            console.error('Error fetching users:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate("/login");
            }
        }
    };

    const fetchPosts = async () => {
        if (!checkAdminRole()) return;

        try {
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10,
                search: searchTerm
            });

            const response = await axiosInstance.get(`/api/admin/posts?${params}`);
            setPosts(response.data.posts);
        } catch (error) {
            console.error('Error fetching posts:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate("/login");
            }
        }
    };

    const handleUserAction = async (action, userId) => {
        if (!checkAdminRole()) return;

        try {
            switch (action) {
                case 'delete':
                    await axiosInstance.delete(`/api/admin/users/${userId}`);
                    break;
                case 'restore':
                    await axiosInstance.patch(`/api/admin/users/${userId}/restore`);
                    break;
                case 'changeRole':
                    // Mở popup thay vì dùng prompt
                    const user = users.find(u => u._id === userId);
                    setSelectedUserForRole(user);
                    setNewRole(user.role);
                    setShowRoleModal(true);
                    return; // Không fetchUsers ngay
                default:
                    break;
            }
            fetchUsers();
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate("/login");
            }
        }
    };

    const handlePostAction = async (action, postId) => {
        if (!checkAdminRole()) return;

        try {
            switch (action) {
                case 'delete':
                    await axiosInstance.delete(`/api/admin/posts/${postId}`);
                    break;
                case 'restore':
                    await axiosInstance.patch(`/api/admin/posts/${postId}/restore`);
                    break;
            }
            fetchPosts();
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate("/login");
            }
        }
    };

    const fetchReports = async () => {
        if (!checkAdminRole()) return;

        try {
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10,
                status: selectedStatus
            });

            const response = await axiosInstance.get(`/api/reports/admin?${params}`);
            setReports(response.data.reports);
        } catch (error) {
            console.error('Error fetching reports:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate("/login");
            }
        }
    };

    const handleReportAction = async (action, reportId, status = null, adminNotes = null) => {
        if (!checkAdminRole()) return;

        try {
            switch (action) {
                case 'updateStatus':
                    await axiosInstance.put(`/api/reports/admin/${reportId}/status`, { status, adminNotes });
                    break;
                case 'deleteItem':
                    // Xóa bài viết/comment bị báo cáo thay vì xóa báo cáo
                    const report = reports.find(r => r._id === reportId);
                    if (report) {
                        if (report.itemType === 'post') {
                            await axiosInstance.delete(`/api/admin/posts/${report.reportedItem}`);
                        } else if (report.itemType === 'comment') {
                            await axiosInstance.delete(`/api/admin/comments/${report.reportedItem}`);
                        }
                        // Cập nhật trạng thái báo cáo thành resolved
                        await axiosInstance.put(`/api/reports/admin/${reportId}/status`, {
                            status: 'resolved',
                            adminNotes: 'Item đã bị xóa do vi phạm'
                        });
                    }
                    break;
                case 'restore':
                    await axiosInstance.patch(`/api/reports/admin/${reportId}/restore`);
                    break;
            }
            fetchReports();
            fetchPosts(); // Refresh posts nếu có xóa
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate("/login");
            }
        }
    };

    const handleRowClick = (item, type) => {
        setSelectedItem(item);
        setModalType(type);
        setShowDetailModal(true);
    };

    const closeModal = () => {
        setShowDetailModal(false);
        setSelectedItem(null);
        setModalType('');
    };

    const handleRoleSubmit = async () => {
        if (!newRole || !['user', 'admin', 'moderator'].includes(newRole)) {
            alert('Vui lòng chọn role hợp lệ');
            return;
        }

        try {
            await axiosInstance.patch(`/api/admin/users/${selectedUserForRole._id}/role`, { role: newRole });
            setShowRoleModal(false);
            setSelectedUserForRole(null);
            setNewRole('');
            fetchUsers();
        } catch (error) {
            console.error('Error changing role:', error);
            alert('Có lỗi xảy ra khi thay đổi role');
        }
    };

    const handleStatusSubmit = async () => {
        if (!newStatus || !['reviewed', 'resolved', 'dismissed'].includes(newStatus)) {
            alert('Vui lòng chọn trạng thái hợp lệ');
            return;
        }

        try {
            await handleReportAction('updateStatus', selectedReportForStatus._id, newStatus, adminNotes);
            setShowStatusModal(false);
            setSelectedReportForStatus(null);
            setNewStatus('');
            setAdminNotes('');
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Có lỗi xảy ra khi cập nhật trạng thái');
        }
    };

    const token = localStorage.getItem("accessToken");
    if (!token) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Truy cập bị từ chối</h1>
                    <p className="text-gray-600 mb-4">Vui lòng đăng nhập để truy cập trang quản lý</p>
                    <button
                        onClick={() => navigate("/login")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Đăng nhập
                    </button>
                </div>
            </div>
        );
    }

    try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        if (tokenPayload.role !== 'admin') {
            return (
                <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Truy cập bị từ chối</h1>
                        <p className="text-gray-600 mb-4">Chỉ có người dùng admin mới có thể truy cập trang này</p>
                        <button
                            onClick={() => navigate("/")}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Về trang chủ
                        </button>
                    </div>
                </div>
            );
        }
    } catch (error) {
        console.error('Error decoding token:', error);
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Truy cập bị từ chối</h1>
                    <p className="text-gray-600 mb-4">Mã xác thực không hợp lệ</p>
                    <button
                        onClick={() => navigate("/login")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Đăng nhập
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className="text-center mt-8">Đang tải...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Admin Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                                <p className="text-sm text-gray-500">Quản lý hệ thống Personal Diary</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate("/")}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Về trang chủ
                            </button>
                            <button
                                onClick={() => {
                                    localStorage.removeItem("accessToken");
                                    localStorage.removeItem("refreshToken");
                                    navigate("/login");
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6">
                {/* Navigation Tabs */}
                <div className="flex space-x-4 mb-6">
                    <button
                        onClick={() => {
                            setActiveTab('dashboard');
                            setSearchParams({});
                        }}
                        className={`px-4 py-2 rounded-lg ${activeTab === 'dashboard'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Bảng điều khiển
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('users');
                            setSearchParams({ tab: 'users' });
                        }}
                        className={`px-4 py-2 rounded-lg ${activeTab === 'users'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Quản lý người dùng
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('posts');
                            setSearchParams({ tab: 'posts' });
                        }}
                        className={`px-4 py-2 rounded-lg ${activeTab === 'posts'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Quản lý bài viết
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('reports');
                            setSearchParams({ tab: 'reports' });
                            fetchReports();
                        }}
                        className={`px-4 py-2 rounded-lg ${activeTab === 'reports'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Quản lý báo cáo
                    </button>
                </div>

                {/* Dashboard Stats */}
                {activeTab === 'dashboard' && stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-gray-700">Tổng số người dùng</h3>
                            <p className="text-3xl font-bold text-blue-600">{users.filter(user => user.role !== 'admin').length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-gray-700">Tổng số bài viết</h3>
                            <p className="text-3xl font-bold text-green-600">{stats.overview.totalPosts}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-gray-700">Bài viết công khai</h3>
                            <p className="text-3xl font-bold text-purple-600">{stats.overview.publicPosts}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-gray-700">Bài viết gần đây (7 ngày)</h3>
                            <p className="text-3xl font-bold text-orange-600">{stats.overview.recentPosts}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-gray-700">Báo cáo chờ xử lý</h3>
                            <p className="text-3xl font-bold text-red-600">{stats.overview.pendingReports || 0}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-gray-700">Phân bố người dùng</h3>
                            <div className="space-y-2">
                                {stats.userStats.filter(stat => stat._id !== 'admin').map((stat) => (
                                    <div key={stat._id} className="flex justify-between">
                                        <span className="capitalize">{stat._id}:</span>
                                        <span className="font-semibold">{stat.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Management */}
                {activeTab === 'users' && (
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-semibold text-gray-900">Quản lý người dùng</h2>
                            <div className="mt-4 flex space-x-4">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm người dùng..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="px-3 py-2 border rounded-lg"
                                />
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="px-3 py-2 border rounded-lg"
                                >
                                    <option value="">Tất cả vai trò</option>
                                    <option value="user">Người dùng</option>
                                    <option value="moderator">Moderator</option>
                                    <option value="admin" disabled>Admin (Ẩn khỏi quản lý)</option>
                                </select>
                                <button
                                    onClick={fetchUsers}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Tìm kiếm
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Người dùng
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Vai trò
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Hành động
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.filter(user => user.role !== 'admin').map((user) => (
                                        <tr
                                            key={user._id}
                                            onClick={() => handleRowClick(user, 'user')}
                                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <img
                                                            className="h-10 w-10 rounded-full"
                                                            src={user.avatar || 'https://via.placeholder.com/40'}
                                                            alt=""
                                                        />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {user.fullName}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                                    user.role === 'moderator' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isDeleted ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {user.isDeleted ? 'Đã xóa' : 'Hoạt động'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    {user.isDeleted ? (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Ngăn không cho trigger row click
                                                                handleUserAction('restore', user._id);
                                                            }}
                                                            className="text-green-600 hover:text-green-900"
                                                        >
                                                            Khôi phục
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // Ngăn không cho trigger row click
                                                                    handleUserAction('changeRole', user._id);
                                                                }}
                                                                className="text-blue-600 hover:text-blue-900"
                                                            >
                                                                Thay đổi vai trò
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // Ngăn không cho trigger row click
                                                                    handleUserAction('delete', user._id);
                                                                }}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                Xóa
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Posts Management */}
                {activeTab === 'posts' && (
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-semibold text-gray-900">Quản lý bài viết</h2>
                            <div className="mt-4 flex space-x-4">
                                <input
                                    type="text"
                                    placeholder="Tìm kiết bài viết..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="px-3 py-2 border rounded-lg"
                                />
                                <button
                                    onClick={fetchPosts}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Tìm kiếm
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Bài viết
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tác giả
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Hành động
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {posts.map((post) => (
                                        <tr
                                            key={post._id}
                                            onClick={() => handleRowClick(post, 'post')}
                                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {post.title}
                                                    </div>
                                                    <div className="text-sm text-gray-500 truncate max-w-xs">
                                                        {post.content}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {post.userId?.fullName || 'Unknown'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {post.userId?.username || 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${post.isDeleted ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {post.isDeleted ? 'Đã xóa' : 'Hoạt động'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    {post.isDeleted ? (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Ngăn không cho trigger row click
                                                                handlePostAction('restore', post._id);
                                                            }}
                                                            className="text-green-600 hover:text-green-900"
                                                        >
                                                            Khôi phục
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Ngăn không cho trigger row click
                                                                handlePostAction('delete', post._id);
                                                            }}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Xóa
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Reports Management */}
                {activeTab === 'reports' && (
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-semibold text-gray-900">Quản lý báo cáo</h2>
                            <div className="mt-4 flex space-x-4">
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="px-3 py-2 border rounded-lg"
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="pending">Chờ xử lý</option>
                                    <option value="reviewed">Đã xem</option>
                                    <option value="resolved">Đã xử lý</option>
                                    <option value="dismissed">Đã hủy</option>
                                </select>
                                <button
                                    onClick={fetchReports}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Lọc
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Người báo cáo
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Loại báo cáo
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Lý do
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Hành động
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reports.map((report) => (
                                        <tr
                                            key={report._id}
                                            onClick={() => handleRowClick(report, 'report')}
                                            className="cursor-pointer hover:bg-gray-200 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {report.reporter?.fullName || 'Unknown'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {report.reporter?.email || 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${report.itemType === 'post' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {report.itemType === 'post' ? 'Bài viết' : 'Bình luận'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 capitalize">
                                                    {report.reason.replace('_', ' ')}
                                                </div>
                                                {report.description && (
                                                    <div className="text-sm text-gray-500 truncate max-w-xs">
                                                        {report.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    report.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                                                        report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {report.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    {report.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // Ngăn không cho trigger row click
                                                                    setSelectedReportForStatus(report);
                                                                    setNewStatus(report.status);
                                                                    setAdminNotes(report.adminNotes || '');
                                                                    setShowStatusModal(true);
                                                                }}
                                                                className="text-blue-600 hover:text-blue-900"
                                                            >
                                                                Cập nhật trạng thái
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Ngăn không cho trigger row click
                                                            handleReportAction('deleteItem', report._id);
                                                        }}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Xóa báo cáo
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Role Change Modal */}
                {showRoleModal && selectedUserForRole && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold text-gray-900">
                                    Thay đổi Role cho User
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowRoleModal(false);
                                        setSelectedUserForRole(null);
                                        setNewRole('');
                                    }}
                                    className="text-gray-400 hover:text-gray-600 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        User: {selectedUserForRole.fullName} ({selectedUserForRole.username})
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Role hiện tại
                                    </label>
                                    <span className={`px-3 py-2 text-sm font-semibold rounded-full ${selectedUserForRole.role === 'admin' ? 'bg-red-100 text-red-800' :
                                        selectedUserForRole.role === 'moderator' ? 'bg-blue-100 text-blue-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                        {selectedUserForRole.role}
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chọn Role mới
                                    </label>
                                    <select
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="user">User</option>
                                        <option value="moderator">Moderator</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        onClick={() => {
                                            setShowRoleModal(false);
                                            setSelectedUserForRole(null);
                                            setNewRole('');
                                        }}
                                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleRoleSubmit}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Cập nhật Role
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Update Modal */}
                {showStatusModal && selectedReportForStatus && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold text-gray-900">
                                    Cập nhật Trạng thái Báo cáo
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowStatusModal(false);
                                        setSelectedReportForStatus(null);
                                        setNewStatus('');
                                        setAdminNotes('');
                                    }}
                                    className="text-gray-400 hover:text-gray-600 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Báo cáo từ: {selectedReportForStatus.reporter?.fullName}
                                    </label>
                                    <p className="text-sm text-gray-500">
                                        Loại: {selectedReportForStatus.itemType === 'post' ? 'Post' : 'Comment'} |
                                        Lý do: {selectedReportForStatus.reason.replace('_', ' ')}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Trạng thái hiện tại
                                    </label>
                                    <span className={`px-3 py-2 text-sm font-semibold rounded-full ${selectedReportForStatus.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        selectedReportForStatus.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                                            selectedReportForStatus.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {selectedReportForStatus.status}
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chọn trạng thái mới
                                    </label>
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="reviewed">Reviewed</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="dismissed">Dismissed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ghi chú Admin (tùy chọn)
                                    </label>
                                    <textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        rows="3"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Nhập ghi chú về việc xử lý báo cáo..."
                                        maxLength="1000"
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        onClick={() => {
                                            setShowStatusModal(false);
                                            setSelectedReportForStatus(null);
                                            setNewStatus('');
                                            setAdminNotes('');
                                        }}
                                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleStatusSubmit}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Cập nhật Trạng thái
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Detail Modal */}
                {showDetailModal && selectedItem && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold text-gray-900">
                                    {modalType === 'user' && 'Chi tiết người dùng'}
                                    {modalType === 'post' && 'Chi tiết bài viết'}
                                    {modalType === 'report' && 'Chi tiết báo cáo'}
                                </h3>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            {modalType === 'user' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
                                            <p className="text-sm text-gray-900">{selectedItem.fullName}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Tên người dùng</label>
                                            <p className="text-sm text-gray-900">{selectedItem.username}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Email</label>
                                            <p className="text-sm text-gray-900">{selectedItem.email}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Vai trò</label>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${selectedItem.role === 'admin' ? 'bg-red-100 text-red-800' :
                                                selectedItem.role === 'moderator' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                {selectedItem.role}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${selectedItem.isDeleted ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                            {selectedItem.isDeleted ? 'Deleted' : 'Active'}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Ngày tạo</label>
                                        <p className="text-sm text-gray-900">
                                            {new Date(selectedItem.createdAt).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                    {selectedItem.isDeleted && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Ngày xóa</label>
                                            <p className="text-sm text-gray-900">
                                                {new Date(selectedItem.deletedAt).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {modalType === 'post' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
                                        <p className="text-sm text-gray-900 font-semibold">{selectedItem.title}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Nội dung</label>
                                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                                            {selectedItem.content}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Tác giả</label>
                                            <p className="text-sm text-gray-900">{selectedItem.userId?.fullName || 'Unknown'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Tâm trạng</label>
                                            <p className="text-sm text-gray-900 capitalize">{selectedItem.mood}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Thời tiết</label>
                                            <p className="text-sm text-gray-900 capitalize">{selectedItem.weather}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Công khai</label>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${selectedItem.isPublic ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {selectedItem.isPublic ? 'Yes' : 'No'}
                                            </span>
                                        </div>
                                    </div>
                                    {selectedItem.tags && selectedItem.tags.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Tags</label>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedItem.tags.map((tag, index) => (
                                                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${selectedItem.isDeleted ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                            {selectedItem.isDeleted ? 'Deleted' : 'Active'}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Ngày tạo</label>
                                        <p className="text-sm text-gray-900">
                                            {new Date(selectedItem.createdAt).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                    {selectedItem.isDeleted && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Ngày xóa</label>
                                            <p className="text-sm text-gray-900">
                                                {new Date(selectedItem.deletedAt).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {modalType === 'report' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Người báo cáo</label>
                                            <p className="text-sm text-gray-900">{selectedItem.reporter?.fullName || 'Unknown'}</p>
                                            <p className="text-xs text-gray-500">{selectedItem.reporter?.email || 'Unknown'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Loại báo cáo</label>
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${selectedItem.itemType === 'post' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {selectedItem.itemType === 'post' ? 'Post' : 'Comment'}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Lý do</label>
                                            <p className="text-sm text-gray-900 capitalize">{selectedItem.reason.replace('_', ' ')}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${selectedItem.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                selectedItem.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                                                    selectedItem.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {selectedItem.status}
                                            </span>
                                        </div>
                                    </div>
                                    {selectedItem.description && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                                            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                                                {selectedItem.description}
                                            </p>
                                        </div>
                                    )}
                                    {selectedItem.adminNotes && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Ghi chú của admin</label>
                                            <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded-lg">
                                                {selectedItem.adminNotes}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Ngày báo cáo</label>
                                        <p className="text-sm text-gray-900">
                                            {new Date(selectedItem.createdAt).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                    {selectedItem.resolvedBy && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Người xử lý</label>
                                            <p className="text-sm text-gray-900">{selectedItem.resolvedBy?.fullName || 'Unknown'}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(selectedItem.resolvedAt).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end pt-4 border-t mt-6">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
