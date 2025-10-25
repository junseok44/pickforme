import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "can't be null"],
    },
    body: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const model = mongoose.models.Notifications || mongoose.model('Notifications', NotificationSchema);

export default model;
