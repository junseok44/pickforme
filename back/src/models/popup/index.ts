import mongoose from 'mongoose';

const popupSchema = new mongoose.Schema({
  popup_id: {
    type: String,
    required: true,
    unique: true, // 사람이 읽을 수 있는 고유 ID로 설정해두면 됩니다.
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  startDate: {
    type: Date,
    required: false,
  },
  endDate: {
    type: Date,
    required: false,
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
  updatedAt: {
    type: Date,
    default: () => new Date(),
  },
});

const Popup = mongoose.models.Popup || mongoose.model('Popup', popupSchema);

export default Popup;
