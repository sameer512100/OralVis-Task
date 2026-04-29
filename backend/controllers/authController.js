import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const genToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

const generatePatientId = () => {
  // Generate unique patient ID in format: PAT-{8-char random alphanumeric}
  const randomPart = uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();
  return `PAT-${randomPart}`;
};

export const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    // Auto-generate patientId for patient role
    const patientId = role === "patient" ? generatePatientId() : undefined;
    const user = await User.create({ name, patientId, email, password, role });
    const token = genToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, role: user.role, patientId: user.patientId },
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
