import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  schoolName: string;
  schoolAddress: string;
  subject: string;
  className: string;
  teacherName: string;
}

const SettingsSchema = new Schema<ISettings>(
  {
    schoolName: { type: String, default: 'Delhi Public School' },
    schoolAddress: { type: String, default: 'Sector-4, Bokaro' },
    subject: { type: String, default: 'Science' },
    className: { type: String, default: '8th' },
    teacherName: { type: String, default: 'Lakshya' }
  },
  { timestamps: true }
);

export default mongoose.model<ISettings>('Settings', SettingsSchema);
