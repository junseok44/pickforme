import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  connectionId: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
  },
});

const model = mongoose.models.Sessions || mongoose.model('Sessions', SessionSchema);

export default model;
