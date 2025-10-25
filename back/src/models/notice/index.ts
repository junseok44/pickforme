import mongoose from 'mongoose';

const NoticeSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "can't be null"],
    },
    title: {
      type: String,
      required: [true, "can't be null"],
    },
  },
  {
    timestamps: true,
  }
);

const model = mongoose.models.Notices || mongoose.model('Notices', NoticeSchema);

export default model;
