const { Product } = require('../models/product');
const express = require('express');
const { Category } = require('../models/category');
const router = express.Router();
const multer = require('multer');

const mongoose = require('mongoose');

//To determine the extension of the uploaded image
const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
}

//Uploading Images with multer {renaming the image using diskstorage}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('Invalid image type');

        if (isValid) {
            uploadError = null;
        }
        cb(uploadError, 'public/uploads')
    },
    filename: function (req, file, cb) {

        const fileName = file.originalname.split(' ').join('-');  //same wit .replace('','-')
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
})

const uploadOptions = multer({ storage: storage })




// //Get all products  {Original Code}
// //To get selected fields :- await Product.find().select('name image -_id')
// router.get(`/`, async (req, res) => {
//     const productList = await Product.find().populate('category');

//     if (!productList) {
//         res.status(500).json({ success: false })
//     }
//     res.send(productList);
// })

//Get all the products and If querry parameters available get related categories
//The sample URL may look like follows
// http://localhost:3000/api/v1/products?categories=5f15d54cf3a046427a1c26e3,5f15d545f3a046427a1c26e2
router.get(`/`, async (req, res) => {
    let filter = {};
    if (req.query.categories) {
        filter = { category: req.query.categories.split(',') }
    }

    const productList = await Product.find(filter).populate('category');

    if (!productList) {
        res.status(500).json({ success: false })
    }
    res.send(productList);
})



//Get one product
router.get('/:id', async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category');

    if (!product) {
        res.status(404).send('no product with thta id');
    }
    res.send(product);
})


//Get Products count
//tutor uses {await Product.countDocuments((count)=>count)} but it throw an error
router.get('/get/count', async (req, res) => {
    const productCount = await Product.countDocuments();

    if (!productCount) {
        return res.status(500).json({ success: false });
    }
    res.status(200).json({ count: productCount });
})


//Get featured products

//Get selected number of featured products
router.get('/get/featured/:count', async (req, res) => {
    const count = req.params.count ? req.params.count : 0
    const featuredProducts = await Product.find({ isFeatured: true }).limit(+count);
    

    if (!featuredProducts) {       
        res.status(404).json({ success: false });
    }
    else {        
        res.send(featuredProducts)
    }

})

// /**START:- Get all featured products */
// router.get('/get/featured',async(req,res)=>{
//     const featuredProducts = await Product.find({isFeatured: true})

//     if(!featuredProducts){
//         res.status(404).json({success: false});
//     }
//     else{
//         res.send(featuredProducts)
//     }

// })
// /**END:- Get all featured products */









//Post a new product
router.post(`/`, uploadOptions.single('image'), async (req, res) => {
    // console.log(req.file);

    try {
        const category = await Category.findById(req.body.category);
        
        if (!category) {
            return res.status(400).send('No such category available');
        } else {
            const file = req.file;
            if (!file) {
                return res.status(400).send('No Image is selected to Upload');
            } else {
                const fileName = req.file.filename;
                const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;


                const product = new Product({
                    name: req.body.name,
                    description: req.body.description,
                    richDescription: req.body.richDescription,
                    image: `${basePath}${fileName}`, // To make the URL like "http://localhost:3000/public/upload/image-254655456"
                    brand: req.body.brand,
                    price: req.body.price,
                    category: req.body.category,
                    countInStock: req.body.countInStock,
                    rating: req.body.rating,
                    numReviews: req.body.numReviews,
                    isFeatured: req.body.isFeatured
                })

                


                try {
                    
                    const result = await product.save();
                    return res.status(201).json(result);
                }
                catch(error) {
                    return res.status(500).send({messsage: 'Product Creation Unsuccessfull', error: error});
                }
            }
        }
    }
    catch {
        
        return res.status(500).send('The product cannot be created {Wrong Category ID Format}');
    }

})




//Update a product

// /* START:- My old way of validating and catching the ID error */
// router.put('/:id', async (req, res) => {
//     try {
//         const category = await Category.findById(req.body.category);
//         if (!category) {
//             return res.status(404).send('No category found as mentioned');
//         } else {
//             const product = await Product.findByIdAndUpdate(
//                 req.params.id,
//                 {
//                     name: req.body.name,
//                     description: req.body.description,
//                     richDescription: req.body.richDescription,
//                     image: req.body.image,
//                     brand: req.body.brand,
//                     price: req.body.price,
//                     category: req.body.category,
//                     countInStock: req.body.countInStock,
//                     rating: req.body.rating,
//                     numReviews: req.body.numReviews,
//                     isFeatured: req.body.isFeatured
//                 },
//                 { new: true, runValidators: true }
//             );
//             if (!product) {
//                 return res.status(404).send('cannot find the product to update');
//             } else {
//                 return res.status(201).json(product);
//             }
//         }

//     } catch {
//         return res.status(500).send('Invalid Entry');

//     }
// })
// /* END:- My old way of validating and catching the ID error */


/* START:- validate using mongoose ID validator  */

//Update a Product
router.put('/:id', uploadOptions.single('image'), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(500).send('InValid Product ID !!');
    } else {
        if (!mongoose.isValidObjectId(req.body.category)) {
            return res.status(500).send('Invalid Category ID !!');
        } else {

            const existingProduct = await Product.findById(req.params.id);

            if (!existingProduct) {
                return res.status(404).send('cannot find the product to update');
            } else {

                const file = req.file;
                let imagepath;

                if (file) {
                    const fileName = req.file.filename;
                    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
                    imagepath = `${basePath}${fileName}`;
                }else{
                    imagepath = existingProduct.image;
                }



                const product = await Product.findByIdAndUpdate(
                    req.params.id,
                    {
                        name: req.body.name,
                        description: req.body.description,
                        richDescription: req.body.richDescription,
                        image: imagepath,
                        brand: req.body.brand,
                        price: req.body.price,
                        category: req.body.category,
                        countInStock: req.body.countInStock,
                        rating: req.body.rating,
                        numReviews: req.body.numReviews,
                        isFeatured: req.body.isFeatured
                    },
                    { new: true, runValidators: true }
                );
                if (!product) {
                    return res.status(404).send('Updating Product Unsuccessfull..!');
                } else {
                    return res.status(201).json(product);
                }

            }

        }
    }
})
/* END:- validate using mongoose ID validator  */

//Uploading Images to the Image Gallery using PUT method
router.put('/gallery-images/:id', uploadOptions.array('images', 10), async (req, res) => {

    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(500).send('InValid Product ID !!');
    } else {

        const files = req.files;
        if (!files) {
            return res.status(400).send('No Images are selected to Upload into the Gallery');
        } else {
            let imagesPaths = [];
            const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

            files.map(file => {
                imagesPaths.push(`${basePath}${file.filename}`);
            })

            const product = await Product.findByIdAndUpdate(
                req.params.id,
                {
                    images: imagesPaths
                },
                { new: true, runValidators: true }
            );
            if (!product) {
                return res.status(404).send('cannot find the product to update');
            } else {
                return res.status(201).json(product);
            }

        }

    }
})


//Delete a product
router.delete('/:id', (req, res) => {
    Product.findByIdAndDelete(req.params.id).then(product => {
        if (product) {
            return res.status(200).json({ success: true, message: 'The Product deleted successfully' })
        } else {
            return res.status(404).json({ success: false, message: 'Product not found to delete' });
        }
    }).catch(err => {
        return res.status(500).json({ success: false, error: err });
    })
})



module.exports = router;