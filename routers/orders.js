const { Order } = require('../models/order')
const { Product } = require('../models/product')
const express = require('express');
const { OrderItem } = require('../models/order-item');
const router = express.Router();

const stripe = require('stripe')('sk_test_51N2rTNCaqVFK5FUVYhM9xHCcn0T9rj9RLGBWdAfFyscTVeLYlLXbkaUnST6WKqlA9LlqZ3KwlEKS2NATkRjUKX0b00CFuU85br');


//Get all orders
router.get('/', async (req, res) => {
    //Order from newest to oldest
    const orderList = await Order.find().populate('user', 'name').sort({ 'dateOrdered': -1 });

    if (!orderList) {
        return res.status(404).send('No Orders fonud');
    } else {
        return res.status(200).json(orderList);
    }
})

//Get one order
router.get('/:id', async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name')
        // .populate('orderItems');
        .populate({ path: 'orderItems', populate: { path: 'product', populate: 'category' } });

    if (!order) {
        return res.status(404).send('No Order fonud');
    } else {
        return res.status(200).json(order);
    }
})


//Get Order count
router.get('/get/count',async(req,res)=>{
    const orderCount = await Order.countDocuments();

    if(!orderCount){
        return res.status(500).json({success:false});
    }
    res.status(200).json({count : orderCount});
})


//Get all orders by a specific user
router.get('/get/userorders/:userId', async (req, res) => {


    const userOrderList = await Order.find({ user: req.params.userId })
        .populate({ path: 'orderItems', populate: { path: 'product', populate: 'category' } });

    if (!userOrderList) {
        return res.status(404).send('No Orders fonud');
    } else {
        return res.status(200).json(userOrderList);
    }
})


//Post new order
router.post('/', async (req, res) => {

    const orderItemsIds = Promise.all(req.body.orderItems.map(async orderItem => {
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        })

        newOrderItemResult = await newOrderItem.save();

        return newOrderItemResult._id;
    }))

    const orderItemIdsResolved = await orderItemsIds;

    const totalPrices = await Promise.all(orderItemIdsResolved.map(async (orderItemId) => {
        const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
        const totalPrice = orderItem.product.price * orderItem.quantity;
        return totalPrice;
    }))

    // console.log(orderItemIdsResolved);
    // console.log(totalPrices);

    //This is a new constatnt.. Different from the above totalPrice constant from the totalPrices
    const totalPrice = totalPrices.reduce((a, b) => a + b, 0);


    const order = new Order({
        orderItems: orderItemIdsResolved,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user,
    })

    result = await order.save();

    if (!result)
        return res.status(404).send('The Order cannot be created')

    res.status(201).json(result);

})


//Stripe checkout API
router.post('/create-checkout-session', async( req,res) => {
   
    const orderItems = req.body;   


    if(!orderItems){
        return res.status(400).send('Checkout session cannot be created .. !!!');
    }else {
        const lineItems = await Promise.all (orderItems.map(async (orderItem) => {
            const product = await Product.findById(orderItem.product);            
            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                      name: product.name,
                    },
                    unit_amount: product.price * 100,
                  },
                  quantity: orderItem.quantity,
            }
        }))

        
        const session = await stripe.checkout.sessions.create({
            payment_method_types : ['card'],
            line_items: lineItems,
            mode: 'payment',
            // success_url: `http://localhost:4200/success`, 
            success_url: `http://localhost:4200/success?session_id={CHECKOUT_SESSION_ID}`,           
            cancel_url: 'http://localhost:4200/error',
        });

        res.json({id: session.id});
    }
})


//Update Order
router.put('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            {
                status: req.body.status
            },
            { new: true, runValidators: true });
        if (order) {
            return res.status(201).json(order);
        } else {
            return res.status(404).send('No Order found under that id')
        }
    }
    catch {
        return res.status(500).send('The Order cannot be Updated')
    }
})


//Delete Order
router.delete('/:id', async (req, res) => {

    Order.findByIdAndRemove(req.params.id).then(async order => {
        if (order) {
            await order.orderItems.map(async orderitem => {
                await OrderItem.findByIdAndRemove(orderitem)
            })
            return res.status(200).json({ success: true, message: 'The Order Deleted Successfully' })
        } else {
            return res.status(404).json({ success: false, message: 'No Matching Order to Deleted' })
        }
    }).catch(err => {
        return res.status(500).json({ success: false, error: err })
    })

})


//Get Total Number of Sales
router.get('/get/totalsales', async (req, res) => {
    const totalSales = await Order.aggregate([
        { $group: { _id: null, totalsales: { $sum: '$totalPrice' } } }
    ])

    if (!totalSales) {
        return res.status(400).send('The total sales cannot be generated')
    }

    res.send({ totalsales: totalSales.pop().totalsales })
})



module.exports = router;