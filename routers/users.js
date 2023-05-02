const { User } = require('../models/user');
const express = require('express');
const router = express.Router();

//importing JWT
const jwt = require('jsonwebtoken');

//to hash the password
const bcrypt = require('bcryptjs');

//Get all the users
router.get('/', async (req, res) => {
    const usersList = await User.find().select('-passwordHash');

    if (!usersList) {
        return res.status(404).send('no users fonud');
    } else {
        return res.status(200).json(usersList);
    }
})

//Get a single user
router.get('/:id', async (req, res) => {

    const user = await User.findById(req.params.id).select('-passwordHash');

    if (!user) {
        return res.status(404).send('no user with the ID');
    } else {
        return res.status(200).json(user);
    }
})


//Get user count
router.get('/get/count',async(req,res)=>{
    const userCount = await User.countDocuments();

    if(!userCount){
        return res.status(500).json({success:false});
    }
    res.status(200).json({count : userCount});
})


//POST a new User 
router.post('/', async (req, res) => {
    console.log("Came here");
    console.log(req.body);
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        street: req.body.street,
        apartment: req.body.apartment,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        isAdmin: req.body.isAdmin
    });

    try {
        const newUser = await user.save();
        return res.status(200).json(newUser);
    } catch(error){
        return res.status(500).send({message:'The User cannot be created', error: error});
    }


    // /*Throws uncaught error */
    // const newUser =  await user.save();
    // if(!newUser){
    //     return res.status(500).send('The User cannot be created')
    // }else{
    //     return res.status(200).json(newUser);
    // }    
})


//Update an existing user
router.put('/:id', async (req, res) => {

    const userExsist = await User.findById(req.params.id);
    let newPassword
    if(req.body.password){
        newPassword = bcrypt.hashSync(req.body.password,10);
    }else{
        newPassword = userExsist.passwordHash;
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            email: req.body.email,
            passwordHash: newPassword,
            street: req.body.street,
            apartment: req.body.apartment,
            city: req.body.city,
            zip: req.body.zip,
            country: req.body.country,
            phone: req.body.phone,
            isAdmin: req.body.isAdmin
        },
        {new: true, runValidators: true});

        if(!user){
            return res.status(404).send('Cannot find the user to Update');
        }else{
            return res.status(200).json(user);
        }
})


//User authentication
router.post('/login',async(req,res)=>{
    const user = await User.findOne({email: req.body.email});
    const secret = process.env.secret;

    if(!user){
        return res.status(404).send('The user not found');
    }

    if(user && bcrypt.compareSync(req.body.password, user.passwordHash)){
        const token = jwt.sign(
            {
                userId: user.id,
                isAdmin: user.isAdmin

            },
            secret,
            {
                expiresIn: '1h'
            }
        )
        return res.status(200).send({user: user.email, token: token});
    }else{
        return res.status(400).send('User is not authenticated');
    }   
    
})

//Register new user
router.post('/register', async(req,res)=>{
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        street: req.body.street,
        apartment: req.body.apartment,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        isAdmin: req.body.isAdmin

    })

    try {
        const newUser = await user.save();
        return res.status(200).json(newUser);
    } catch {
        return res.status(500).send('The User cannot be created')
    }
})

//Delete a user
router.delete('/:id', (req, res) => {
    User.findByIdAndDelete(req.params.id).then(user => {
        if (user) {
            return res.status(200).json({ success: true, message: 'The User deleted successfully' })
        } else {
            return res.status(404).json({ success: false, message: 'User not found to delete' });
        }
    }).catch(err => {
        return res.status(500).json({ success: false, error: err });
    })
})




module.exports = router;