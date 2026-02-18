import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44, supabase } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('messages');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // System Messages
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState({
    message: '',
    type: 'info',
    expires_at: ''
  });

  // Users
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  // Rides
  const [rides, setRides] = useState([]);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    try {
      const { data, error } = await supabase.from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error || !data?.is_admin) {
        alert('Access denied - Admin only');
        navigate('/');
        return;
      }
      
      setIsAdmin(true);
      loadData();
    } catch (error) {
      console.error('Admin check failed:', error);
      navigate('/');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [messagesRes, usersRes, subsRes, ridesRes] = await Promise.all([
        base44.entities.SystemMessage.list(),
        base44.entities.User.list(),
        base44.entities.Subscription.list(),
        base44.entities.Ride.list()
      ]);

      setMessages(messagesRes.data || []);
      setUsers(usersRes || []);
      setSubscriptions(subsRes || []);
      setRides(ridesRes || []);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
    setLoading(false);
  };

  const createMessage = async () => {
    if (!newMessage.message.trim()) {
      alert('Message cannot be empty');
      return;
    }

    try {
      await base44.entities.SystemMessage.create({
        message: newMessage.message,
        type: newMessage.type,
        is_active: true,
        expires_at: newMessage.expires_at || null
      });

      setNewMessage({ message: '', type: 'info', expires_at: '' });
      loadData();
    } catch (error) {
      console.error('Failed to create message:', error);
      alert('Failed to create message');
    }
  };

  const deleteMessage = async (id) => {
    if (!confirm('Delete this message?')) return;
    
    try {
      await base44.entities.SystemMessage.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const toggleMessageActive = async (id, currentStatus) => {
    try {
      await base44.entities.SystemMessage.update(id, { is_active: !currentStatus });
      loadData();
    } catch (error) {
      console.error('Failed to update message:', error);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Admin Panel</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'messages'
                ? 'bg-white text-purple-900'
                : 'bg-purple-700 text-white hover:bg-purple-600'
            }`}
          >
            System Messages
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'users'
                ? 'bg-white text-purple-900'
                : 'bg-purple-700 text-white hover:bg-purple-600'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('rides')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'rides'
                ? 'bg-white text-purple-900'
                : 'bg-purple-700 text-white hover:bg-purple-600'
            }`}
          >
            Rides ({rides.length})
          </button>
        </div>

        {/* System Messages Tab */}
        {activeTab === 'messages' && (
          <div className="bg-white rounded-xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Homepage Messages</h2>

            {/* Create New Message */}
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h3 className="font-bold mb-4">Create New Message</h3>
              <div className="space-y-4">
                <textarea
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                  placeholder="Enter message text..."
                  className="w-full p-3 border rounded-lg"
                  rows="3"
                />
                <div className="flex gap-4">
                  <select
                    value={newMessage.type}
                    onChange={(e) => setNewMessage({ ...newMessage, type: e.target.value })}
                    className="px-4 py-2 border rounded-lg"
                  >
                    <option value="info">Info (Blue)</option>
                    <option value="warning">Warning (Yellow)</option>
                    <option value="error">Error (Red)</option>
                    <option value="success">Success (Green)</option>
                  </select>
                  <input
                    type="datetime-local"
                    value={newMessage.expires_at}
                    onChange={(e) => setNewMessage({ ...newMessage, expires_at: e.target.value })}
                    className="px-4 py-2 border rounded-lg"
                    placeholder="Expires at (optional)"
                  />
                  <button
                    onClick={createMessage}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                  >
                    Create Message
                  </button>
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No messages yet</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      msg.type === 'info' ? 'border-blue-500 bg-blue-50' :
                      msg.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                      msg.type === 'error' ? 'border-red-500 bg-red-50' :
                      'border-green-500 bg-green-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-gray-800 font-medium">{msg.message}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Created: {new Date(msg.created_at).toLocaleString()}
                          {msg.expires_at && ` • Expires: ${new Date(msg.expires_at).toLocaleString()}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleMessageActive(msg.id, msg.is_active)}
                          className={`px-4 py-2 rounded-lg font-semibold ${
                            msg.is_active
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-400 text-white hover:bg-gray-500'
                          }`}
                        >
                          {msg.is_active ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">User Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Created</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const sub = subscriptions.find(s => s.user_id === u.id);
                    return (
                      <tr key={u.id} className="border-b">
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3">
                          {sub && sub.status === 'active' ? (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                              Premium
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                              Free
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <button className="text-purple-600 hover:text-purple-800 font-semibold">
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Rides Tab */}
        {activeTab === 'rides' && (
          <div className="bg-white rounded-xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Ride Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 text-left">Ride</th>
                    <th className="px-4 py-3 text-left">Park</th>
                    <th className="px-4 py-3 text-left">Current Wait</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Last Synced</th>
                  </tr>
                </thead>
                <tbody>
                  {rides.map((ride) => (
                    <tr key={ride.id} className="border-b">
                      <td className="px-4 py-3 font-semibold">{ride.name}</td>
                      <td className="px-4 py-3">{ride.park_name}</td>
                      <td className="px-4 py-3">
                        {ride.current_wait_minutes !== null ? `${ride.current_wait_minutes} min` : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        {ride.is_open ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Open</span>
                        ) : (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">Closed</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {ride.last_synced_at ? new Date(ride.last_synced_at).toLocaleString() : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}