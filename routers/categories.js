const { Category } = require('../models/category');
const express = require('express');
const router = express.Router();

//Get all categories
router.get('/', async (req, res) => {
    const categoryList = await Category.find();  

    if (!categoryList) {
        res.status(404).json({ success: false });
    }
    res.status(200).send(categoryList);
})

//Get category by ID
router.get('/:id', (req, res) => {
    Category.findById(req.params.id).then(category => {
        if (category) {
            res.status(200).json(category);
        }else {
            res.status(404).json({ message: 'The Category with given Id was not found' });
        }
        
        
        

    }).catch(err => {
        res.status(500).json({ message: 'Category not found', error: err });
    })
})



//Add Category
router.post('/', async (req, res) => {    

    const category = new Category({
        name: req.body.name,
        icon: req.body.icon,
        color: req.body.color
    })

    result = await category.save();

    if (!result)
     return res.status(404).send('The Category cannot be created')

    res.status(201).json(result);


    /**START :- Sending a proper error message back to the client */

    // //Way 01
    // try{
    //     result = await category.save();
    //     res.status(201).json(result);  
    // }
    // catch{
    //     res.status(404).send('The Category cannot be created')
    // }

    // //Way 02
    // category.save().then((result)=>{
    //     res.status(201).json(result);  
    // }).catch(()=>{
    //     res.status(500).json({message:'The Category cannot be created'});
    // })

    /**END :- Sending a proper error message back to the client */

})


//Delete category
router.delete('/:id', (req, res) => {
    Category.findByIdAndRemove(req.params.id).then(result => {
        if (result) {
            return res.status(200).json({ success: true, message: 'The category deleted successfully' });
        } else {
            return res.status(404).json({ success: false, message: 'Category not found to delete' });
        }
    }).catch(err => {
        return res.status(400).json({ success: false, error: err });
    })
})


//Updte category
router.put('/:id', async (req, res) => {
    //passing two parameters to the function findByIdAndUpdate()
    //id and the object
    try {
        const category = await Category.findByIdAndUpdate(            
            req.params.id,
            {
                name: req.body.name,
                icon: req.body.icon,
                color: req.body.color
            },
            { new: true, runValidators: true });
        if (category) {
            return res.status(201).json(category);
        } else {            
            return res.status(404).send('No category found under that id')
        }
    }
    catch {        
        return res.status(500).send('The Category cannot be Updated')
    }
})


module.exports = router;

