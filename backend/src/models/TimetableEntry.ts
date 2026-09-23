import mongoose, { Document, Schema, Types } from 'mongoose';

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface ITimetableEntry extends Document {
  entryId: string;
  timetableId: Types.ObjectId;
  day: DayOfWeek;
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
  subjectId: Types.ObjectId;
  facultyId: Types.ObjectId;
  roomId: Types.ObjectId;
}

const timetableEntrySchema = new Schema<ITimetableEntry>(
  {
    entryId: { type: String, required: true, unique: true, index: true },
    timetableId: { type: Schema.Types.ObjectId, ref: 'Timetable', required: true, index: true },
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true,
      index: true
    },
    startTime: { type: String, required: true, index: true },
    endTime: { type: String, required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    facultyId: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true, index: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true, index: true }
  },
  { timestamps: true }
);

// Compound indexes for fast lookup and conflict prevention
timetableEntrySchema.index({ timetableId: 1, day: 1, startTime: 1 });
timetableEntrySchema.index({ facultyId: 1, day: 1, startTime: 1, endTime: 1 });
timetableEntrySchema.index({ roomId: 1, day: 1, startTime: 1, endTime: 1 });

export const TimetableEntry = mongoose.model<ITimetableEntry>('TimetableEntry', timetableEntrySchema);
