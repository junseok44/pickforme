import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: [true, "can't be null"],
    },
    eventId: {
      type: String,
      required: [true, "can't be null"],
    },
  },
  {
    timestamps: true,
  }
);

const model = mongoose.models.Events || mongoose.model('Events', EventSchema);

export default model;
