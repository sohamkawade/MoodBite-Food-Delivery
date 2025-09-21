import React, { useEffect, useState } from "react";
import { MdPeople, MdSearch, MdAdd, MdEdit, MdDelete, MdVisibility, MdClose } from "react-icons/md";
import { usersAPI } from "../../services/api";

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);

  const [users, setUsers] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await usersAPI.getAll();
        if (res.success) {
          const mapped = (res.data.users || []).map(u => {
            const pref = u.preferences;
            let preferencesText = "-";
            if (Array.isArray(pref)) {
              preferencesText = pref.join(', ');
            } else if (pref && typeof pref === 'object') {
              const parts = [];
              if (pref.cuisine) parts.push(`Cuisine: ${Array.isArray(pref.cuisine) ? pref.cuisine.join(', ') : pref.cuisine}`);
              if (pref.spiceLevel) parts.push(`Spice: ${pref.spiceLevel}`);
              if (pref.dietaryRestrictions) {
                const dr = Array.isArray(pref.dietaryRestrictions) ? pref.dietaryRestrictions.join(', ') : pref.dietaryRestrictions;
                parts.push(`Diet: ${dr}`);
              }
              if (pref.favoriteRestaurants) parts.push(`Fav Restaurants: ${Array.isArray(pref.favoriteRestaurants) ? pref.favoriteRestaurants.join(', ') : pref.favoriteRestaurants}`);
              if (pref.favoriteDishes) parts.push(`Fav Dishes: ${Array.isArray(pref.favoriteDishes) ? pref.favoriteDishes.join(', ') : pref.favoriteDishes}`);
              preferencesText = parts.join(' • ') || '-';
            } else if (typeof pref === 'string') {
              preferencesText = pref;
            }
            const primaryAddress = Array.isArray(u.addresses) && u.addresses.length > 0 ? u.addresses[0] : null;
            const addr = primaryAddress && primaryAddress.address ? primaryAddress.address : null;
            const fullAddress = addr ? [addr.street, addr.landmark, addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ') : '-';

            return ({
              id: u._id,
              name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
              email: u.email,
              phone: u.phone || '',
              role: u.loyaltyTier === 'platinum' ? 'VIP Customer' : u.loyaltyTier === 'gold' ? 'Premium Customer' : 'Customer',
              status: (u.status || 'active').toLowerCase() === 'active' ? 'Active' : (u.status || 'inactive').charAt(0).toUpperCase() + (u.status || 'inactive').slice(1),
              joinDate: u.joinDate ? new Date(u.joinDate).toLocaleDateString() : '-',
              lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '-',
              totalOrders: u.totalOrders || 0,
              totalSpent: u.totalSpent || 0,
              address: fullAddress,
              preferences: preferencesText,
            });
          });
          setUsers(mapped);
        }
      } catch (e) {
        console.error('Failed to load users', e);
      }
    };
    load();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm);
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const matchesStatus = selectedStatus === "all" || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800";
      case "Inactive": return "bg-gray-100 text-gray-800";
      case "Suspended": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "VIP Customer": return "bg-purple-100 text-purple-800";
      case "Premium Customer": return "bg-blue-100 text-blue-800";
      case "Customer": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleEditUser = (user) => {
    setEditUser(user);
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    try {
      await usersAPI.update(editUser.id, {
        name: editUser.name,
        email: editUser.email,
        phone: editUser.phone,
        role: editUser.role,
        status: editUser.status
      });
      setUsers(prev => prev.map(u => u.id === editUser.id ? editUser : u));
      setEditUser(null);
    } catch (e) {
      console.error('Update user failed', e);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    try {
      await usersAPI.suspend(deleteUser.id);
      setUsers(prev => prev.map(u => u.id === deleteUser.id ? { ...u, status: 'Suspended' } : u));
      setDeleteUser(null);
    } catch (e) {
      console.error('Suspend user failed', e);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-2 md:pt-2 pb-6 space-y-4 sm:space-y-6">
      {/* Professional Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
              <MdPeople size={28} className="text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 text-sm">Monitor customer accounts, manage status, and track user activity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <MdPeople size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-green-600">{users.filter(u => u.status === "Active").length}</p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <MdPeople size={24} className="text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">VIP Customers</p>
              <p className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === "VIP Customer").length}</p>
            </div>
            <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
              <MdPeople size={24} className="text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Blocked Users</p>
              <p className="text-2xl font-bold text-red-600">{users.filter(u => u.status === "Blocked").length}</p>
            </div>
            <div className="p-2 sm:p-3 bg-red-100 rounded-lg">
              <MdPeople size={24} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 flex-1 w-full">
            <div className="relative flex-1 max-w-md w-full">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search users by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value="all">All Roles</option>
              <option value="VIP Customer">VIP Customer</option>
              <option value="Premium Customer">Premium Customer</option>
              <option value="Customer">Customer</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Customer Database</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-[11px] sm:text-xs text-gray-500">ID: {user.id}</div>
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                    <div>
                      <div className="text-xs sm:text-sm text-gray-900">{user.email}</div>
                      <div className="text-[11px] sm:text-xs text-gray-500">{user.phone}</div>
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm text-gray-900">
                      <div>{user.totalOrders} orders</div>
                      <div className="text-[11px] sm:text-xs text-gray-500">Customer</div>
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setViewUser(user)}
                        className="px-2 sm:px-3 py-1 border border-green-500 text-green-500 rounded hover:bg-green-50 transition-colors flex items-center space-x-1"
                      >
                        <MdVisibility size={14} />
                        <span>View</span>
                      </button>
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="px-2 sm:px-3 py-1 border border-blue-500 text-blue-500 rounded hover:bg-blue-50 transition-colors flex items-center space-x-1"
                      >
                        <MdEdit size={14} />
                        <span>Edit</span>
                      </button>
                      <button 
                        onClick={() => setDeleteUser(user)}
                        className="px-2 sm:px-3 py-1 border border-red-500 text-red-500 rounded hover:bg-red-50 transition-colors flex items-center space-x-1"
                      >
                        <MdDelete size={14} />
                        <span>Block</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View User Modal */}
      {viewUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-3 sm:p-6 w-full max-w-[95%] sm:max-w-xl md:max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-xl font-bold text-gray-900">User Details - {viewUser.name}</h3>
              <button 
                onClick={() => setViewUser(null)}
                className="p-2 -m-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MdClose size={22} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <p className="text-sm text-gray-900 break-words">{viewUser.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                  <p className="text-sm text-gray-900 break-words">{viewUser.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-sm text-gray-900 break-words">{viewUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-sm text-gray-900 break-words">{viewUser.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <span className={`inline-flex px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-full ${getRoleColor(viewUser.role)}`}>
                    {viewUser.role}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-full ${getStatusColor(viewUser.status)}`}>
                    {viewUser.status}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <p className="text-sm text-gray-900 break-words">{viewUser.address}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Food Preferences</label>
                <p className="text-sm text-gray-900 break-words">{viewUser.preferences}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Orders</label>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{viewUser.totalOrders}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                  <p className="text-xl sm:text-2xl font-bold text-green-500">2024</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-3 sm:p-6 w-full max-w-[95%] sm:max-w-md">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-xl font-bold text-gray-900">Edit User - {editUser.name}</h3>
              <button 
                onClick={() => setEditUser(null)}
                className="p-2 -m-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MdClose size={22} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={editUser.name}
                  onChange={(e) => setEditUser({...editUser, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input 
                  type="email" 
                  value={editUser.email}
                  onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input 
                  type="tel" 
                  value={editUser.phone}
                  onChange={(e) => setEditUser({...editUser, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select 
                  value={editUser.role}
                  onChange={(e) => setEditUser({...editUser, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                >
                  <option value="Customer">Customer</option>
                  <option value="Premium Customer">Premium Customer</option>
                  <option value="VIP Customer">VIP Customer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select 
                  value={editUser.status}
                  onChange={(e) => setEditUser({...editUser, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button 
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                >
                  Save Changes
                </button>
                <button 
                  onClick={() => setEditUser(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-3 sm:p-6 w-full max-w-[95%] sm:max-w-md">
            <div className="text-center">
              <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Suspend User</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Are you sure you want to suspend user <strong>{deleteUser.name}</strong>?
              </p>
              <p className="text-xs sm:text-sm text-red-600 mb-4 sm:mb-6">This action cannot be undone.</p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button 
                  onClick={handleDeleteUser}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                  Suspend User
                </button>
                <button 
                  onClick={() => setDeleteUser(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
