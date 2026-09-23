import React, { useState, useEffect } from 'react';
import { Room, RoomType } from '../../types';
import { roomService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { Building, Plus, Edit2, Trash2, Search, Users } from 'lucide-react';

export const RoomsManagePage: React.FC = () => {
  const toast = useToast();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [building, setBuilding] = useState<string>('Aryabhata Block');
  const [floor, setFloor] = useState<number>(2);
  const [capacity, setCapacity] = useState<number>(65);
  const [roomType, setRoomType] = useState<RoomType>('Classroom');

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterType) params.roomType = filterType;
      if (searchQuery) params.search = searchQuery;

      const res = await roomService.getAll(params);
      if (res.data) setRooms(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [filterType, searchQuery]);

  const openAdd = () => {
    setEditingRoom(null);
    setRoomNumber('');
    setBuilding('Aryabhata Block');
    setFloor(2);
    setCapacity(65);
    setRoomType('Classroom');
    setIsModalOpen(true);
  };

  const openEdit = (r: Room) => {
    setEditingRoom(r);
    setRoomNumber(r.roomNumber);
    setBuilding(r.building);
    setFloor(r.floor);
    setCapacity(r.capacity);
    setRoomType(r.roomType);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber || !building) return;

    try {
      if (editingRoom) {
        await roomService.update(editingRoom._id, {
          roomNumber: roomNumber.toUpperCase(),
          building,
          floor,
          capacity,
          roomType
        });
        toast.success('Room updated successfully');
      } else {
        await roomService.create({
          roomNumber: roomNumber.toUpperCase(),
          building,
          floor,
          capacity,
          roomType
        });
        toast.success('Room created successfully');
      }
      setIsModalOpen(false);
      fetchRooms();
    } catch (err: any) {
      toast.error('Operation failed', err.response?.data?.message);
    }
  };

  const handleDelete = async (id: string, num: string) => {
    if (!window.confirm(`Delete room "${num}"?`)) return;
    try {
      await roomService.delete(id);
      toast.success('Room deleted');
      fetchRooms();
    } catch (err: any) {
      toast.error('Failed to delete', err.response?.data?.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Rooms & Laboratories Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Manage lecture halls, laboratory spaces, and seminar auditoriums.
              </p>
            </div>
          </div>
        </div>

        <Button variant="primary" size="md" onClick={openAdd} leftIcon={<Plus className="w-4 h-4" />}>
          + Add New Room
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Search Rooms"
            placeholder="Search room number or building..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
          <Select
            label="Room Type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            options={[
              { value: '', label: 'All Room Types' },
              { value: 'Classroom', label: 'Classrooms' },
              { value: 'Laboratory', label: 'Laboratories' },
              { value: 'Seminar Hall', label: 'Seminar Halls & Auditoriums' }
            ]}
          />
        </div>
      </Card>

      {/* Rooms Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Campus Facilities</h3>
            <p className="text-xs text-slate-500">{rooms.length} facilities registered</p>
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
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Room Number</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Building</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Floor</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Seating Capacity</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rooms.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-4 font-mono font-bold text-slate-900 bg-slate-50/30">
                      {r.roomNumber}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          r.roomType === 'Classroom'
                            ? 'bg-blue-50 text-brand-700'
                            : r.roomType === 'Laboratory'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {r.roomType}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700">{r.building}</td>
                    <td className="p-4 text-slate-600">Floor {r.floor}</td>
                    <td className="p-4 text-slate-800 font-semibold">{r.capacity} Seats</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(r)}
                          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(r._id, r.roomNumber)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Room Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? 'Edit Facility' : 'Add New Room / Laboratory'}
        subtitle="Configure room identity, building location, seating capacity, and facility type."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Room / Lab Identifier"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value.toUpperCase())}
            placeholder="e.g. CSE-205 or LAB-AI-01"
            required
          />

          <Select
            label="Facility Type"
            value={roomType}
            onChange={(e) => setRoomType(e.target.value as RoomType)}
            options={[
              { value: 'Classroom', label: 'Classroom' },
              { value: 'Laboratory', label: 'Laboratory' },
              { value: 'Seminar Hall', label: 'Seminar Hall' }
            ]}
          />

          <Input
            label="Building Name"
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            placeholder="e.g. Aryabhata Block"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Floor Level"
              type="number"
              value={floor}
              onChange={(e) => setFloor(Number(e.target.value))}
              required
            />
            <Input
              label="Seating Capacity"
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingRoom ? 'Update Room' : 'Create Room'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
