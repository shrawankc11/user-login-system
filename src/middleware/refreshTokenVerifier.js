const getToken = require('../utils/tokenGen');

/**
 * middleware to check if the user sent refreshToken is valid or not 
 * this handler will be used in generating new accesstokens using refreshtokens
 * if the refreshtoken is valid then we send an accesstoken else sent an error message
 */
refreshTokenVerifier = (req, res) => {
    const user = req.user;
    if (user && user.refreshToken === req.token) {
        const accessToken = getToken({ username: user.username, id: user.id }, 1);
        return res.json({ fromCache: req.fromCache, newAccessToken: accessToken });
    } else {
        return res.status(403).json({ error: 'invalid refresh token' })
    }
}

module.exports = refreshTokenVerifier;