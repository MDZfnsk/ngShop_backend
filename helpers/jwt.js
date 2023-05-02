// const expressJwt = require('express-jwt');

const { expressjwt: jwt } = require("express-jwt");




function authJwt(){
    const secret = process.env.secret;
    const api = process.env.API_URL
    
    return jwt({
        secret,
        algorithms: ['HS256'],        
        isRevoked: isRevoked
    }).unless({
        path: [
           /* // {url: `${api}/products` , methods: ['GET', 'OPTIONS']}, */

            // {url: /\/public\/uploads(.*)/ , methods: ['GET', 'OPTIONS']},
            // {url: /\/api\/v1\/products(.*)/ , methods: ['GET', 'OPTIONS']},
            // {url: /\/api\/v1\/categories(.*)/ , methods: ['GET', 'OPTIONS']},
            // `${api}/users/login`,            
            // `${api}/users/register`

            
            // { url: /(.*)/}
        ]
    })
}

async function isRevoked(req,token){
    // console.log(token.payload.isAdmin);
    if(!token.payload.isAdmin){
        return true;
    }else{
        // console.log('Yeah');
        return false;
    }
    
}

module.exports = authJwt;