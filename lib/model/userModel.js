const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Ensure you hash this with bcrypt
  role: {
    type: String,
    enum: ["admin", "officer"],
    required: true,
  },
});

const User = mongoose.model("User", UserSchema);
