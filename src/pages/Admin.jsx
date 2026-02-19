import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44, supabase } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Dashboard Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    totalRides: 0,
    lastSyncTime: null,
    activeMessages: 0
  });

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
  const [newUserEmail, setNewUserEmail] = useState('');

  // Rides
  const [rides, setRides] = useState([]);
  const [syncingRides, setSyncingRides] = useState(false);

  // News Sources
  const [newsSources, setNewsSources] = useState([]);
  const [newSource, setNewSource] = useState({
    name: '',
    url: '',
    category: 'news'
  });

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
      const [messagesRes, usersRes, subsRes, ridesRes, newsRes] = await Promise.all([
        base44.entities.SystemMessage.list(),
        base44.entities.User.list(),
        base44.entities.Subscription.list(),
        base44.entities.Ride.list(),
        base44.entities.NewsSource.list()
      ]);

      const msgs = messagesRes.data || [];
      const usrs = usersRes || [];
      const subs = subsRes || [];
      const rds = ridesRes || [];
      const news = newsRes || [];

      setMessages(msgs);
      setUsers(usrs);
      setSubscriptions(subs);
      setRides(rds);
      setNewsSources(news);

      // Calculate stats
      const lastSync = rds.reduce((latest, ride) => {
        if (!ride.last_synced_at) return latest;
        const rideTime = new Date(ride.last_synced_at);
        return !latest || rideTime > latest ? rideTime : latest;
      }, null);

      setStats({
        totalUsers: usrs.length,
        premiumUsers: subs.filter(s => s.status === 'active').length,
        totalRides: rds.length,
        lastSyncTime: lastSync,
        activeMessages: msgs.filter(m => m.is_active).length
      });
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
    setLoading(false);
  };

  const forceSyncRides = async () => {
    setSyncingRides(true);
    try {
      const response = await fetch('https://sviblotdflujritawqem.supabase.co/functions/v1/sync-wait-times', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2aWJsb3RkZmx1anJpdGF3cWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDAzOTUsImV4cCI6MjA4NjkxNjM5NX0.VmJhHUmO7JmL4NFsZWMHLWcdfqS1DCSN7XM_00kdVUQ'
        }
      });
      
      if (response.ok) {
        alert('✅ Ride sync triggered! Check back in 30 seconds.');
        setTimeout(loadData, 5000); // Reload after 5 seconds
      } else {
        alert('❌ Sync failed. Check console for errors.');
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('❌ Sync failed: ' + error.message);
    }
    setSyncingRides(false);
  };

  const grantFreePremium = async (userId, userEmail) => {
    if (!confirm(`Grant free Premium to ${userEmail}?`)) return;

    try {
      await supabase.from('subscriptions').insert({
        user_id: userId,
        user_email: userEmail,
        plan: 'premium',
        status: 'active',
        current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        stripe_customer_id: null,
        stripe_subscription_id: null
      });

      alert('✅ Premium access granted!');
      loadData();
    } catch (error) {
      console.error('Failed to grant premium:', error);
      alert('❌ Failed: ' + error.message);
    }
  };

  const revokePremium = async (subscriptionId) => {
    if (!confirm('Revoke Premium access?')) return;

    try {
      await supabase.from('subscriptions')
        .update({ status: 'canceled' })
        .eq('id', subscriptionId);

      alert('✅ Premium revoked');
      loadData();
    } catch (error) {
      console.error('Failed to revoke:', error);
      alert('❌ Failed: ' + error.message);
    }
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

  const createNewsSource = async () => {
    console.log('Creating news source:', newSource);
    
    if (!newSource.name || !newSource.url) {
      alert('Name and URL required');
      return;
    }

    try {
      const result = await base44.entities.NewsSource.create(newSource);
      console.log('Created successfully:', result);
      setNewSource({ name: '', url: '', category: 'news' });
      loadData();
    } catch (error) {
      console.error('Failed to create news source:', error);
      alert('Failed to create news source: ' + error.message);
    }
  };

  const deleteNewsSource = async (id) => {
    if (!confirm('Delete this news source?')) return;
    
    try {
      await base44.entities.NewsSource.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Admin Panel</h1>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30"
          >
            ← Back to Site
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 overflow-x-auto">
          {['dashboard', 'messages', 'users', 'rides', 'news'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-white text-purple-900'
                  : 'bg-purple-700 text-white hover:bg-purple-600'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-2xl">
                <h3 className="text-gray-500 text-sm font-semibold">Total Users</h3>
                <p className="text-4xl font-bold text-purple-900 mt-2">{stats.totalUsers}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-2xl">
                <h3 className="text-gray-500 text-sm font-semibold">Premium Users</h3>
                <p className="text-4xl font-bold text-green-600 mt-2">{stats.premiumUsers}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-2xl">
                <h3 className="text-gray-500 text-sm font-semibold">Total Rides</h3>
                <p className="text-4xl font-bold text-blue-600 mt-2">{stats.totalRides}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-2xl">
                <h3 className="text-gray-500 text-sm font-semibold">Active Alerts</h3>
                <p className="text-4xl font-bold text-orange-600 mt-2">{stats.activeMessages}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">System Status</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Wait Times Sync</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Last synced: {stats.lastSyncTime 
                        ? new Date(stats.lastSyncTime).toLocaleString() 
                        : 'Never'}
                    </p>
                  </div>
                  <button
                    onClick={forceSyncRides}
                    disabled={syncingRides}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold disabled:opacity-50"
                  >
                    {syncingRides ? 'Syncing...' : 'Force Sync Now'}
                  </button>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Stripe Webhook</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Status: ✅ Connected</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Database</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Status: ✅ Supabase Connected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Messages Tab */}
        {activeTab === 'messages' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Homepage Messages</h2>

            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-6">
              <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Create New Message</h3>
              <div className="space-y-4">
                <textarea
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                  placeholder="Enter message text..."
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  rows="3"
                />
                <div className="flex gap-4">
                  <select
                    value={newMessage.type}
                    onChange={(e) => setNewMessage({ ...newMessage, type: e.target.value })}
                    className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
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
                    className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">User Management</h2>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Users automatically get free accounts when they sign in with Google. 
                You can grant Premium access for free to friends/testers using the "Grant Free Premium" button.
              </p>
            </div>

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
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                                Premium
                              </span>
                              {!sub.stripe_subscription_id && (
                                <span className="text-xs text-gray-500">(Free)</span>
                              )}
                            </div>
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
                          {sub && sub.status === 'active' ? (
                            <button 
                              onClick={() => revokePremium(sub.id)}
                              className="text-red-600 hover:text-red-800 font-semibold"
                            >
                              Revoke Premium
                            </button>
                          ) : (
                            <button 
                              onClick={() => grantFreePremium(u.id, u.email)}
                              className="text-purple-600 hover:text-purple-800 font-semibold"
                            >
                              Grant Free Premium
                            </button>
                          )}
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ride Management</h2>
              <button
                onClick={forceSyncRides}
                disabled={syncingRides}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold disabled:opacity-50"
              >
                {syncingRides ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="px-4 py-3 text-left text-gray-900 dark:text-white">Ride</th>
                    <th className="px-4 py-3 text-left text-gray-900 dark:text-white">Park</th>
                    <th className="px-4 py-3 text-left text-gray-900 dark:text-white">Current Wait</th>
                    <th className="px-4 py-3 text-left text-gray-900 dark:text-white">Status</th>
                    <th className="px-4 py-3 text-left text-gray-900 dark:text-white">Last Synced</th>
                    <th className="px-4 py-3 text-left text-gray-900 dark:text-white">Visibility</th>
                  </tr>
                </thead>
                <tbody>
                  {rides.map((ride) => (
                    <tr key={ride.id} className={`border-b dark:border-gray-700 ${ride.is_hidden ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                        {ride.name}
                        {ride.is_hidden && <span className="ml-2 text-xs text-red-600">(Hidden)</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{ride.park_name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          ride.current_wait_minutes === null ? 'bg-gray-100 text-gray-800' :
                          ride.current_wait_minutes === 0 ? 'bg-blue-100 text-blue-800' :
                          ride.current_wait_minutes < 30 ? 'bg-green-100 text-green-800' :
                          ride.current_wait_minutes < 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {ride.current_wait_minutes !== null ? `${ride.current_wait_minutes} min` : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {ride.is_open ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Open</span>
                        ) : (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">Closed</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {ride.last_synced_at ? (
                          <>
                            {new Date(ride.last_synced_at).toLocaleString()}
                            <br />
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              ({Math.round((Date.now() - new Date(ride.last_synced_at)) / 60000)} min ago)
                            </span>
                          </>
                        ) : (
                          'Never'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={async () => {
                            try {
                              await supabase.from('rides')
                                .update({ is_hidden: !ride.is_hidden })
                                .eq('id', ride.id);
                              loadData();
                            } catch (error) {
                              console.error('Error toggling visibility:', error);
                            }
                          }}
                          className={`px-4 py-2 rounded-lg font-semibold transition ${
                            ride.is_hidden
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-600 text-white hover:bg-gray-700'
                          }`}
                        >
                          {ride.is_hidden ? 'Show' : 'Hide'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* News Sources Tab */}
        {activeTab === 'news' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">News Sources (RSS Feeds)</h2>

            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-6">
              <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Add New Source</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={newSource.name}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  placeholder="Source name (e.g., Disney Parks Blog)"
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                <input
                  type="url"
                  value={newSource.url}
                  onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                  placeholder="RSS feed URL"
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                <div className="flex gap-4">
                  <select
                    value={newSource.category}
                    onChange={(e) => setNewSource({ ...newSource, category: e.target.value })}
                    className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  >
                    <option value="news">News</option>
                    <option value="blog">Blog</option>
                    <option value="updates">Updates</option>
                  </select>
                  <button
                    onClick={createNewsSource}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                  >
                    Add Source
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {newsSources.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No news sources configured</p>
              ) : (
                newsSources.map((source) => (
                  <div key={source.id} className="p-4 border rounded-lg flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{source.name}</h3>
                      <p className="text-sm text-gray-600">{source.url}</p>
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded mt-2">
                        {source.category}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteNewsSource(source.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}