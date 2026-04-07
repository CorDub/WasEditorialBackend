import express from "express";
const router = express.Router();

export async function logout(req, res) {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error when destroying session in logout route', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
    });
    res.clearCookie('connect.sid');
    res.status(200).json({message: 'Logged out'});
  } catch(error) {
    console.error("Error in logout route:", error);
  }
}
router.post('/user/logout', logout)

export default router;