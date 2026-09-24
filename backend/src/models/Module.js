import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'],
    },
    description: { type: String, default: '' },
    icon: { type: String, default: 'layers' }, // lucide-react icon name, read by the client
    color: { type: String, default: '#F2751A' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Module', moduleSchema);
