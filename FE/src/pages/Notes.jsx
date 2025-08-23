import React, { useState, useEffect } from 'react';
import { Header } from '../components';
import axios from 'axios';

const PersonalDiary = () => {
  const [diaries, setDiaries] = useState([]);
  const [editingDiary, setEditingDiary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' hoặc 'my'
  const [showCommentInput, setShowCommentInput] = useState(null); // ID của bài đang comment
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(null); // ID của bài đang xem comments
  const [comments, setComments] = useState({}); // Object chứa comments của từng bài
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDiary, setSelectedDiary] = useState(null); 
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood: 'other',
    weather: 'other',
    isPublic: false,
    tags: '',
    location: ''
  });

  const moods = [
    { value: 'happy', label: '😊 Vui vẻ', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'sad', label: '😢 Buồn', color: 'bg-blue-100 text-blue-800' },
    { value: 'excited', label: '🤩 Hào hứng', color: 'bg-pink-100 text-pink-800' },
    { value: 'angry', label: '😠 Tức giận', color: 'bg-red-100 text-red-800' },
    { value: 'peaceful', label: '😌 Bình yên', color: 'bg-green-100 text-green-800' },
    { value: 'anxious', label: '😰 Lo lắng', color: 'bg-orange-100 text-orange-800' },
    { value: 'grateful', label: '🙏 Biết ơn', color: 'bg-purple-100 text-purple-800' },
    { value: 'other', label: '😐 Khác', color: 'bg-gray-100 text-gray-800' }
  ];

  const weathers = [
    { value: 'sunny', label: '☀️ Nắng' },
    { value: 'cloudy', label: '☁️ Nhiều mây' },
    { value: 'rainy', label: '🌧️ Mưa' },
    { value: 'snowy', label: '❄️ Tuyết' },
    { value: 'windy', label: '💨 Gió' },
    { value: 'other', label: '🌤️ Khác' }
  ];

  useEffect(() => {
    fetchDiaries();
  }, []);

  useEffect(() => {
    fetchDiaries(activeTab);
  }, [activeTab]);

  const fetchDiaries = async (tab = activeTab) => {
    try {
      const token = localStorage.getItem('accessToken');
      const endpoint = tab === 'my' ? '/api/diaries/my' : '/api/diaries';
      const response = await axios.get(`http://localhost:9999${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDiaries(response.data.diaries);
    } catch (error) {
      console.error('Error fetching diaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const diaryData = {
        ...formData,
        tags: tagsArray
      };

      if (editingDiary) {
        await axios.put(`http://localhost:9999/api/diaries/${editingDiary._id}`, diaryData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('http://localhost:9999/api/diaries', diaryData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setShowCreateForm(false);
      setEditingDiary(null);
      setFormData({
        title: '',
        content: '',
        mood: 'other',
        weather: 'other',
        isPublic: false,
        tags: '',
        location: ''
      });
      fetchDiaries();
    } catch (error) {
      console.error('Error saving diary:', error);
    }
  };

  const handleEdit = (diary) => {
    setEditingDiary(diary);
    setFormData({
      title: diary.title,
      content: diary.content,
      mood: diary.mood,
      weather: diary.weather,
      isPublic: diary.isPublic,
      tags: diary.tags.join(', '),
      location: diary.location
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa nhật ký này?')) {
      try {
        const token = localStorage.getItem('accessToken');
        await axios.delete(`http://localhost:9999/api/diaries/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchDiaries();
      } catch (error) {
        console.error('Error deleting diary:', error);
      }
    }
  };

  const getMoodInfo = (mood) => moods.find(m => m.value === mood) || moods[moods.length - 1];
  const getWeatherInfo = (weather) => weathers.find(w => w.value === weather) || weathers[weathers.length - 1];

  const handleLike = async (diaryId) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`http://localhost:9999/api/diaries/${diaryId}/like`, 
        { action: 'like' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh danh sách để cập nhật like count
      fetchDiaries(activeTab);
    } catch (error) {
      console.error('Error liking diary:', error);
    }
  };

  const handleComment = (diaryId) => {
    setShowCommentInput(diaryId);
    setCommentText('');
  };

  const handleCancelComment = () => {
    setShowCommentInput(null);
    setCommentText('');
  };

  const fetchComments = async (diaryId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`http://localhost:9999/api/diaries/${diaryId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(prev => ({
        ...prev,
        [diaryId]: response.data.comments
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleViewComments = (diaryId) => {
    if (showComments === diaryId) {
      setShowComments(null);
    } else {
      setShowComments(diaryId);
      if (!comments[diaryId]) {
        fetchComments(diaryId);
      }
    }
  };

  const handleSubmitComment = async (diaryId) => {
    if (!commentText.trim()) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post('http://localhost:9999/api/comments', 
        { diaryId, content: commentText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Reset form và refresh danh sách + comments
      setShowCommentInput(null);
      setCommentText('');
      fetchDiaries(activeTab);
      fetchComments(diaryId); // Refresh comments
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  if (loading) {
    return (
      <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-white rounded-3xl">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-white rounded-3xl">
      <Header category="Personal" title="Nhật Ký Cá Nhân" />
      
      <div className="mt-5">
        {/* Tabs */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'all'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🌍 Feed chung
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'my'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📖 Nhật ký của tôi
            </button>
          </div>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            ✍️ Viết nhật ký mới
          </button>
        </div>

        {/* Form tạo/sửa nhật ký */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold mb-4">
                {editingDiary ? 'Chỉnh sửa nhật ký' : 'Viết nhật ký mới'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tiêu đề</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Tâm trạng</label>
                    <select
                      value={formData.mood}
                      onChange={(e) => setFormData({...formData, mood: e.target.value})}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {moods.map(mood => (
                        <option key={mood.value} value={mood.value}>{mood.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Thời tiết</label>
                    <select
                      value={formData.weather}
                      onChange={(e) => setFormData({...formData, weather: e.target.value})}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {weathers.map(weather => (
                        <option key={weather.value} value={weather.value}>{weather.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Nội dung</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    rows="6"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Hôm nay của bạn như thế nào..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Địa điểm</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Bạn đang ở đâu?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Hashtags (phân cách bằng dấu phẩy)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="gia đình, công việc, du lịch..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="isPublic" className="text-sm">
                    Cho phép người khác xem và bình luận
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingDiary(null);
                      setFormData({
                        title: '',
                        content: '',
                        mood: 'other',
                        weather: 'other',
                        isPublic: false,
                        tags: '',
                        location: ''
                      });
                    }}
                    className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    {editingDiary ? 'Cập nhật' : 'Lưu nhật ký'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Danh sách nhật ký */}
        <div className="space-y-4">
          {diaries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📖</div>
              <p className="text-lg">
                {activeTab === 'all' ? 'Chưa có bài đăng công khai nào' : 'Chưa có nhật ký nào'}
              </p>
              <p>
                {activeTab === 'all' 
                  ? 'Hãy tạo bài đăng công khai để chia sẻ với mọi người!' 
                  : 'Hãy bắt đầu ghi lại những khoảnh khắc đáng nhớ!'
                }
              </p>
            </div>
          ) : (
            diaries.map((diary) => {
              const moodInfo = getMoodInfo(diary.mood);
              const weatherInfo = getWeatherInfo(diary.weather);
              const currentUserId = localStorage.getItem('userId'); // Cần lấy từ token hoặc context
              const isOwner = diary.userId._id === currentUserId || activeTab === 'my';
              
              return (
                <div key={diary._id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      {/* Hiển thị tên tác giả nếu không phải bài của mình */}
                      {activeTab === 'all' && diary.userId && (
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-2">
                            {diary.userId.fullName?.charAt(0) || 'U'}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{diary.userId.fullName || 'User'}</span>
                        </div>
                      )}
                      
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">{diary.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span className={`px-2 py-1 rounded-full ${moodInfo.color}`}>
                          {moodInfo.label}
                        </span>
                        <span>{weatherInfo.label}</span>
                        {diary.location && <span>📍 {diary.location}</span>}
                        <span>{new Date(diary.createdAt).toLocaleDateString('vi-VN')}</span>
                        {diary.isPublic && <span className="text-green-600">🌍 Công khai</span>}
                      </div>
                    </div>
                    
                    {/* Chỉ hiển thị nút edit/delete nếu là chủ sở hữu */}
                    {isOwner && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(diary)}
                          className="text-blue-500 hover:text-blue-700 p-1"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(diary._id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-700 mb-3 line-clamp-3">{diary.content}</p>
                  
                  {diary.tags && diary.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {diary.tags.map((tag, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex space-x-4">
                      <span>👁️ {diary.viewCount || 0}</span>
                      <span>❤️ {diary.likeCount || 0}</span>
                      <button
                        onClick={() => handleViewComments(diary._id)}
                        className="hover:text-blue-600 transition-colors"
                      >
                        💬 {diary.commentCount || 0}
                      </button>
                    </div>
                    
                    {/* Nút tương tác - chỉ hiển thị trong feed chung và không phải bài của mình */}
                    {activeTab === 'all' && !isOwner && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleLike(diary._id)}
                          className="flex items-center space-x-1 px-3 py-1 rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                        >
                          <span>❤️</span>
                          <span>Thích</span>
                        </button>
                        <button
                          onClick={() => handleComment(diary._id)}
                          className="flex items-center space-x-1 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                        >
                          <span>💬</span>
                          <span>Bình luận</span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Danh sách comments - hiển thị khi click vào số comment */}
                  {showComments === diary._id && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="font-semibold mb-3 text-gray-800">
                        Bình luận ({diary.commentCount || 0})
                      </h4>
                      
                      {comments[diary._id] && comments[diary._id].length > 0 ? (
                        <div className="space-y-3 mb-4">
                          {comments[diary._id].map((comment) => (
                            <div key={comment._id} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                  {comment.userId?.fullName?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-medium text-sm text-gray-800">
                                      {comment.userId?.fullName || 'User'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 text-sm">{comment.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm mb-4">Chưa có bình luận nào</p>
                      )}
                      
                      {/* Form thêm comment mới */}
                      {activeTab === 'all' && !isOwner && (
                        <div className="border-t pt-3">
                          <div className="flex space-x-3">
                            <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              U
                            </div>
                            <div className="flex-1">
                              <textarea
                                value={showCommentInput === diary._id ? commentText : ''}
                                onChange={(e) => {
                                  setCommentText(e.target.value);
                                  if (showCommentInput !== diary._id) {
                                    setShowCommentInput(diary._id);
                                  }
                                }}
                                placeholder="Viết bình luận..."
                                className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                rows="2"
                              />
                              {showCommentInput === diary._id && (
                                <div className="flex justify-end space-x-2 mt-2">
                                  <button
                                    onClick={handleCancelComment}
                                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                                  >
                                    Hủy
                                  </button>
                                  <button
                                    onClick={() => handleSubmitComment(diary._id)}
                                    disabled={!commentText.trim()}
                                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                  >
                                    Gửi
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comment Input cũ - chỉ hiển thị khi không xem comments */}
                  {showCommentInput === diary._id && showComments !== diary._id && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Viết bình luận của bạn..."
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                      />
                      <div className="flex justify-end space-x-2 mt-3">
                        <button
                          onClick={handleCancelComment}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => handleSubmitComment(diary._id)}
                          disabled={!commentText.trim()}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          Gửi
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalDiary;