import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "can't be null"],
    },
    isMine: {
      type: Boolean,
      required: [true, "can't be null"],
    },
    button: {
      text: String,
      deeplink: String,
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Requests',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: [true, "can't be null"],
    },
    questions: [String],
    products: [
      {
        name: String,
        price: Number,
        rating: Number,
        rating_total_count: Number,
        thumbnail: String,
        link: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const model = mongoose.models.Chats || mongoose.model('Chats', ChatSchema);

export default model;
