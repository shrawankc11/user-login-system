const getToken = require('../utils/tokenGen');

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