import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    origin_price: {
      type: Number,
      required: true,
    },
    discount_rate: {
      type: Number,
      required: true,
    },
    // review_count
    reviews: {
      type: Number,
      required: true,
    },
    // rating
    ratings: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    detail_images: {
      type: [String],
    },
    platform: {
      type: String,
    },
    // image_description
    caption: {
      type: String,
    },
    // page_description
    report: {
      type: String,
    },
    // review_summary
    review: {
      pros: {
        type: [String],
      },
      cons: {
        type: [String],
      },
      bests: {
        type: [String],
      },
    },
  },
  {
    timestamps: true,
  }
);

const model = mongoose.models.Items || mongoose.model('Items', ItemSchema);

export default model;
