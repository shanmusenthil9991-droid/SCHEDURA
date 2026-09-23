import mongoose, { Document, Schema } from 'mongoose';

export type RoomType = 'Classroom' | 'Laboratory' | 'Seminar Hall';

export interface IRoom extends Document {
  roomId: string;
  roomNumber: string;
  building: string;
  floor: number;
  capacity: number;
  roomType: RoomType;
}

const roomSchema = new Schema<IRoom>(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    roomNumber: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    building: { type: String, required: true, trim: true },
    floor: { type: Number, required: true },
    capacity: { type: Number, required: true, default: 60 },
    roomType: {
      type: String,
      enum: ['Classroom', 'Laboratory', 'Seminar Hall'],
      required: true,
      default: 'Classroom'
    }
  },
  { timestamps: true }
);

export const Room = mongoose.model<IRoom>('Room', roomSchema);
