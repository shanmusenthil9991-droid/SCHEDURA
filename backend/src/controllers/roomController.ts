import { Request, Response, NextFunction } from 'express';
import { Room } from '../models/Room.js';
import { roomSchema } from '../validators/masterValidator.js';

export class RoomController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roomType, search } = req.query;
      const filter: any = {};
      if (roomType) filter.roomType = roomType;
      if (search) {
        filter.$or = [
          { roomNumber: { $regex: search, $options: 'i' } },
          { building: { $regex: search, $options: 'i' } }
        ];
      }

      const rooms = await Room.find(filter).sort({ roomNumber: 1 });
      res.status(200).json({ success: true, count: rooms.length, data: rooms });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const room = await Room.findById(req.params.id);
      if (!room) {
        res.status(404).json({ success: false, message: 'Room not found' });
        return;
      }
      res.status(200).json({ success: true, data: room });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = roomSchema.parse(req.body);
      const count = await Room.countDocuments();
      const roomId = `RM${String(count + 1).padStart(3, '0')}`;

      const room = new Room({
        ...data,
        roomId
      });
      await room.save();

      res.status(201).json({ success: true, message: 'Room created', data: room });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = roomSchema.partial().parse(req.body);
      const room = await Room.findByIdAndUpdate(req.params.id, data, { new: true });
      if (!room) {
        res.status(404).json({ success: false, message: 'Room not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Room updated', data: room });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const room = await Room.findByIdAndDelete(req.params.id);
      if (!room) {
        res.status(404).json({ success: false, message: 'Room not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Room deleted' });
    } catch (error) {
      next(error);
    }
  }
}
