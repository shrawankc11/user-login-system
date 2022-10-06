const getToken = require('../utils/tokenGen');

/**
 * middleware to check if the user sent refreshToken is valid or not 
 * this handler will be used in generating new accesstokens using refreshtokens
 * if the refreshtoken is valid then we send an accesstoken else sent an error message
 */
refreshTokenVerifier = (req, res) => {
    //getting the user passed from previous handler
    //either it is from redis or from mongodb
    const user = req.user;
    //if the refresh token in users object is similar to the token sent by user then we procceed with the request
    if (user && user.refreshToken === req.token) {
        //create an accesstoken and send with the response
        const accessToken = getToken({ username: user.username, id: user.id }, 1);
        //set the from cache to either true or false
        return res.json({ fromCache: req.fromCache, newAccessToken: accessToken });
    } else {
        return res.status(403).json({ error: 'invalid refresh token' })
    }
}

module.exports = refreshTokenVerifier;