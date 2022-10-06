const jwt = require('jsonwebtoken');
const { REFRESH_KEY, SECRET_KEY } = require('../configs/config');

/**
 * create access and refresh token
 * pass num : 1 for only accessToken
 * pass num : 2 for both access and refresh Tokens
 *
 * @param {Object} payload
 * @param {number} num
 * @returns {Object}
 */
const getToken = (payload, num) => {
    if (num === 1) {
        return {
            token: jwt.sign(payload, SECRET_KEY, {
                expiresIn: '1m',
            }),
        };
    } else if (num === 2) {
        return {
            refreshToken: jwt.sign(payload, REFRESH_KEY),
            accessToken: jwt.sign(payload, SECRET_KEY, {
                expiresIn: '1m',
            }),
        };
    }
};

module.exports = getToken;
