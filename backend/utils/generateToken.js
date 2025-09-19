const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    const secret = process.env.JWT_KEY;
    return jwt.sign(
        {
            email: user.email,
            id: user._id,
        },
        secret,
        { expiresIn: '365d' }
    );
};

const verifyToken = (token) => {
    try {
        const secret = process.env.JWT_KEY;
        return jwt.verify(token, secret);
    } catch (error) {
        throw new Error('Invalid token');
    }
};

module.exports = { generateToken, verifyToken };
