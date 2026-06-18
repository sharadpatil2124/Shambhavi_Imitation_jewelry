import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: '30d' } // Secure session persists for 30 days
  );
};

export default generateToken;
