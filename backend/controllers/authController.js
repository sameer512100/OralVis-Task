import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

const genToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

export const register = async (req, res) => {
  const { name, patientId, email, password, role } = req.body;
  try {
    const user = await User.create({ name, patientId, email, password, role });
    const token = genToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ message: "Invalid credentials" });
  const token = genToken(user);
  res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
};

export const logout = (req, res) => {
  res.json({ message: "Logged out" });
};
