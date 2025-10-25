import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
    },
    product: {
      id: {
        type: Number,
      },
      url: {
        type: String,
      },
      group: {
        type: String,
        enum: ['bestcategories', 'goldbox', 'local', 'search', 'link', 'liked', 'request'],
      },
    },
    action: {
      type: String,
      enum: ['caption', 'report', 'review', 'like', 'link', 'request', 'question'],
      required: [true, "can't be null"],
    },
    metaData: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

const model = mongoose.models.Logs || mongoose.model('Logs', LogSchema);

export default model;
