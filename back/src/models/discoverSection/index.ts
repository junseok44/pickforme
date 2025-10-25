import mongoose from 'mongoose';

const DiscoverSectionSchema = new mongoose.Schema(
  {
    name: String,
    order: Number,
    products: [
      {
        name: String,
        price: Number,
        origin_price: Number,
        discount_rate: Number,
        reviews: Number,
        ratings: Number,
        url: String,
        thumbnail: String,
        caption: String,
        report: String,
        review: {
          pros: [String],
          cons: [String],
          bests: [String],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const model =
  mongoose.models.DiscoverSections || mongoose.model('DiscoverSections', DiscoverSectionSchema);
/*
model.insertMany([
{
    "name": "더잠2",
    "order": 2,
    "products": [
        {
            "id": 3,
            "productId": 3,
            "productName": "테스트3",
            "productPrice": 1,
            "productImage": "https://naver.com",
            "productUrl": "https://naver.com",
            "categoryName": "더잠",
            "keyword": "",
            "rank": 0,
            "isRocket": false,
            "isFreeShipping": false,
            "caption": "caption",
            "report": "report",
            "detail": {
              id: 3,
              productId: 3,
                "reviews": 555,
                "ratings": 5
            },
            "review": {
                "pros": [
                    "pros1",
                    "pros2"
                ],
                "cons": [
                    "cons1",
                    "cons2"
                ]
            }
        },
        {
            "id": 4,
            "productId": 4,
            "productName": "테스트4",
            "productPrice": 1,
            "productImage": "https://naver.com",
            "productUrl": "https://naver.com",
            "categoryName": "더잠",
            "keyword": "",
            "rank": 0,
            "isRocket": false,
            "isFreeShipping": false,
            "caption": "caption",
            "report": "report",
            "detail": {
              id: 4,
              productId: 4,
                "reviews": 505,
                "ratings": 4
            },
            "review": {
                "pros": [
                    "pros1",
                    "pros2"
                ],
                "cons": [
                    "cons1",
                    "cons2"
                ]
            }
        }
    ]
}, {
    "name": "더잠",
    "order": -1,
    "products": [
        {
            "id": 1,
            "productId": 1,
            "productName": "테스트1",
            "productPrice": 1,
            "productImage": "https://naver.com",
            "productUrl": "https://naver.com",
            "categoryName": "더잠",
            "keyword": "",
            "rank": 0,
            "isRocket": false,
            "isFreeShipping": false,
            "caption": "caption",
            "report": "report",
            "detail": {
              id: 1,
              productId: 1,
                "reviews": 555,
                "ratings": 5
            },
            "review": {
                "pros": [
                    "pros1",
                    "pros2"
                ],
                "cons": [
                    "cons1",
                    "cons2"
                ]
            }
        },
        {
            "id": 2,
            "productId": 2,
            "productName": "테스트2",
            "productPrice": 1,
            "productImage": "https://naver.com",
            "productUrl": "https://naver.com",
            "categoryName": "더잠",
            "keyword": "",
            "rank": 0,
            "isRocket": false,
            "isFreeShipping": false,
            "caption": "caption",
            "report": "report",
            "detail": {
              id: 2,
              productId: 2,
                "reviews": 505,
                "ratings": 4
            },
            "review": {
                "pros": [
                    "pros1",
                    "pros2"
                ],
                "cons": [
                    "cons1",
                    "cons2"
                ]
            }
        }
    ]
}

])
*/

export default model;
