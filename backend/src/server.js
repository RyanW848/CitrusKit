require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");

const PORT = process.env.PORT || 4000;

// Listen immediately so the dev proxy always hits this process. Mongo connects in the background.
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

if (!process.env.MONGO_URI) {
  console.error(
    "MONGO_URI is not set. Update MONGO_URI in .env (e.g. mongodb://127.0.0.1:27017/citruskit if Mongo runs on this machine)."
  );
} else {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => {
      console.error("MongoDB connection failed:", err.message);
      console.error(
        "Update MONGO_URI in .env (e.g. mongodb://127.0.0.1:27017/citruskit if Mongo runs on this machine)."
      );
    });
}
