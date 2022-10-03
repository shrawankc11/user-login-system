const tokenExtractor = (req, res, next) => {
    const token = req.get('authorization');
    if (token && token.slice(0, 8).toLowerCase().startsWith('bearer')) {
        const accessToken = token.substring(7);
        req.token = accessToken;
        next();
    } else {
        return res.status(401).json({ error: 'invalid token' });
    }
};

module.exports = tokenExtractor;
