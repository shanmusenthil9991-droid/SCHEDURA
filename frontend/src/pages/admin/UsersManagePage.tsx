import React, { useState, useEffect } from 'react';
import { User, UserRole, Department, Faculty } from '../../types';
import { userService, departmentService, facultyService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { UserCheck, Plus, Edit2, Trash2, Search, Power, Shield } from 'lucide-react';

export const UsersManagePage: React.FC = () => {
  const toast = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [filterRole, setFilterRole] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [facultyId, setFacultyId] = useState<string>('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterRole) params.role = filterRole;
      if (searchQuery) params.search = searchQuery;

      const [uRes, dRes, fRes] = await Promise.all([
        userService.getAll(params),
        departmentService.getAll(),
        facultyService.getAll()
      ]);
      if (uRes.data) setUsers(uRes.data);
      if (dRes.data) setDepartments(dRes.data);
      if (fRes.data) setFacultyList(fRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load user records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filterRole, searchQuery]);

  const openAdd = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('Schedura@123');
    setRole('STUDENT');
    setDepartmentId(departments.length > 0 ? departments[0]._id : '');
    setFacultyId('');
    setIsModalOpen(true);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPassword('');
    setRole(u.role);
    setDepartmentId(typeof u.departmentId === 'object' ? u.departmentId._id : (u.departmentId as any) || '');
    setFacultyId(typeof u.facultyId === 'object' ? u.facultyId._id : (u.facultyId as any) || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !role) return;

    try {
      if (editingUser) {
        await userService.update(editingUser._id, {
          name,
          email,
          role,
          departmentId: departmentId ? (departmentId as any) : undefined,
          facultyId: facultyId ? (facultyId as any) : undefined,
          password: password || undefined
        });
        toast.success('User updated successfully');
      } else {
        await userService.create({
          name,
          email,
          password: password || 'Schedura@123',
          role,
          departmentId: departmentId ? (departmentId as any) : undefined,
          facultyId: facultyId ? (facultyId as any) : undefined
        });
        toast.success('User account created');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error('Operation failed', err.response?.data?.message);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean, userName: string) => {
    try {
      await userService.toggleStatus(id);
      toast.success(`User ${userName} is now ${currentStatus ? 'Deactivated' : 'Activated'}`);
      fetchUsers();
    } catch (err: any) {
      toast.error('Status update failed', err.response?.data?.message);
    }
  };

  const handleDelete = async (id: string, userName: string) => {
    if (!window.confirm(`Permanently delete user account for "${userName}"?`)) return;
    try {
      await userService.delete(id);
      toast.success('User deleted');
      fetchUsers();
    } catch (err: any) {
      toast.error('Failed to delete', err.response?.data?.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-brand-600">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                User Accounts & Role Permissions
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Manage system administrators, faculty coordinators, and student accounts.
              </p>
            </div>
          </div>
        </div>

        <Button variant="primary" size="md" onClick={openAdd} leftIcon={<Plus className="w-4 h-4" />}>
          + Create User Account
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Search Users"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
          <Select
            label="Role Filter"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            options={[
              { value: '', label: 'All Roles' },
              { value: 'ADMIN', label: 'System Administrators' },
              { value: 'FACULTY_COORDINATOR', label: 'Faculty Coordinators' },
              { value: 'STUDENT', label: 'Students' }
            ]}
          />
        </div>
      </Card>

      {/* Users Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Registered Accounts</h3>
            <p className="text-xs text-slate-500">{users.length} user accounts registered</p>
          </div>
        </div>

        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={6} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border">
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">User Name</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Email Address</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">System Role</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Assigned Department</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Account Status</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => {
                  const roleBadgeVariant =
                    u.role === 'ADMIN' ? 'primary' : u.role === 'FACULTY_COORDINATOR' ? 'draft' : 'secondary';

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/70 transition">
                      <td className="p-4 font-bold text-slate-900">{u.name}</td>
                      <td className="p-4 font-mono text-[11px] text-slate-600">{u.email}</td>
                      <td className="p-4">
                        <Badge variant={roleBadgeVariant as any} size="sm">
                          {u.role === 'FACULTY_COORDINATOR'
                            ? 'Faculty Coordinator'
                            : u.role === 'ADMIN'
                            ? 'Administrator'
                            : 'Student'}
                        </Badge>
                      </td>
                      <td className="p-4 text-slate-600">
                        {typeof u.departmentId === 'object' ? u.departmentId.name : '—'}
                      </td>
                      <td className="p-4">
                        <Badge variant={u.isActive ? 'active' : 'archived'} size="sm" dot>
                          {u.isActive ? 'Active' : 'Disabled'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(u._id, u.isActive, u.name)}
                            title={u.isActive ? 'Deactivate account' : 'Activate account'}
                          >
                            <Power className={`w-3.5 h-3.5 ${u.isActive ? 'text-amber-500' : 'text-emerald-500'}`} />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(u)}
                            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                          >
                            Edit
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(u._id, u.name)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit User Account' : 'Create User Account'}
        subtitle="Specify credentials, assigned role permissions, and departmental link."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dr. Priya Sharma"
            required
          />

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. priya.sharma@college.edu"
            required
          />

          <Input
            label={editingUser ? 'New Password (Leave blank to keep unchanged)' : 'Initial Password'}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <Select
            label="System Role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            options={[
              { value: 'STUDENT', label: 'STUDENT (View Only)' },
              { value: 'FACULTY_COORDINATOR', label: 'FACULTY_COORDINATOR (Timetable Management)' },
              { value: 'ADMIN', label: 'ADMIN (Full System Access)' }
            ]}
          />

          <Select
            label="Assigned Department"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            options={[
              { value: '', label: 'None / Global' },
              ...departments.map((d) => ({ value: d._id, label: `${d.name} (${d.code})` }))
            ]}
          />

          {role === 'FACULTY_COORDINATOR' && (
            <Select
              label="Linked Faculty Profile"
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
              options={[
                { value: '', label: 'Select Faculty Member' },
                ...facultyList.map((f) => ({ value: f._id, label: `${f.name} (${f.designation})` }))
              ]}
            />
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingUser ? 'Update Account' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
