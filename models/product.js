const mongoose = require('mongoose');

const productScema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    richDescription: {
        type: String,
        default:''
    },
    image: {
        type:String,
        default:''
    },
    images: [{
        type: String
    }],
    brand: {
        type: String,
        default:''
    },
    price: {
        type:Number,
        default: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    countInStock: {
        type: Number,
        required: true,
        min: 0,
        max: 255
    },
    rating: {
        type: Number,
        default: 0
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    dateCreated: {
        type: Date,
        default: Date.now
    }
   
})

productScema.virtual('id').get(function(){
    return this._id.toHexString();
})

productScema.set('toJSON',{virtuals: true});


exports.Product = mongoose.model('Product',productScema);

// const Product = mongoose.model('Product',productScema);
// module.exports = Product;
