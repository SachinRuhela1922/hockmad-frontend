require("dotenv").config();
const express = require("express");

const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const Razorpay = require("razorpay");
const nodemailer = require("nodemailer");


const bodyParser = require("body-parser");

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const uri =
  process.env.MONGO_URI ||
  "mongodb+srv://pratapruhela1922:qwerty1922roundsround@demotour.6duqb.mongodb.net/DemoTour?retryWrites=true&w=majority";


// Mongoose connection for user authentication
mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB for authentication");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB for authentication:", err);
  });





// Mongoose schema and model for Career
const careerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  jobTitle: { type: String, required: true },
  resumeLink: { type: String, required: true },
  experience: { type: String, required: true },
  coverLetter: { type: String, required: true },
});

const Career = mongoose.model("Career", careerSchema);

// Setup Nodemailer transporter for sending email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "hockmad1922@gmail.com", // Your email address
    pass: "jlgklbqnwehjocsw", // Your app password (use OAuth for security if needed)
  },
});

// API endpoint to handle career form submissions and send email
app.post("/api/career", async (req, res) => {
  const { name, email, jobTitle, resumeLink, experience, coverLetter } =
    req.body;

  try {
    // Store the career application in MongoDB
    const careerApplication = new Career({
      name,
      email,
      jobTitle,
      resumeLink,
      experience,
      coverLetter,
    });

    await careerApplication.save();

    // Prepare email content
    const mailOptions = {
      from: `"Hockmad" <hockmad1922@gmail.com>`,
      to: email, // Send the email to the user-provided email address
      subject: `Application for ${jobTitle} - ${name}`,
      text: `Dear ${name},\n\nThank you for applying for the position of ${jobTitle}. We have received your application.\n\nDetails:\nName: ${name}\nEmail: ${email}\nJob Title: ${jobTitle}\nResume Link: ${resumeLink}\nExperience: ${experience}\nCover Letter: ${coverLetter}\n\nBest regards,\nHockmad Team`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error sending email:", error);
        return res.status(500).json({ message: "Error sending email", error });
      }
      console.log("Email sent: " + info.response);

      // Respond back with success message
      res
        .status(201)
        .json({
          message: "Application submitted successfully and email sent!",
          careerApplication,
        });
    });
  } catch (error) {
    console.error("Error saving career application or sending email:", error);
    res.status(500).json({ message: "Error submitting application", error });
  }
});



const razorpay = new Razorpay({
  key_id: "rzp_live_066PJHSI9mHDE0", // Replace with your Razorpay Key
  key_secret: "Gcv5IvI835EBDM5Sdf2A9xK5", // Replace with your Razorpay Secret Key
});

app.post("/api/payment", async (req, res) => {
  try {
    const { amount, mobileNumber } = req.body; // Add mobile number to the request body

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Amount in paise
      currency: "INR",
      receipt: `receipt_${new Date().getTime()}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).send("Order creation failed");
    }

    // Store the mobile number after the order is successfully created
    const newMobileEntry = new Mobile({ mobileNumber });
    await newMobileEntry.save(); // Store the mobile number in MongoDB

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Error creating order or storing mobile number:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Define the schema and model for storing mobile numbers
const mobileSchema = new mongoose.Schema({
  mobileNumber: String,
  password: String,
});

const Mobile = mongoose.model("Mobile", mobileSchema);

// API route to store the mobile number and password in MongoDB
app.post("/api/store-number", async (req, res) => {
  const { mobileNumber, password } = req.body;

  try {
    // Create a new entry with mobile number and password (plain text)
    const newMobileEntry = new Mobile({
      mobileNumber,
      password, // Store the password as plain text
    });

    // Save the entry to the database
    await newMobileEntry.save();

    res
      .status(200)
      .send({ message: "Mobile number and password stored successfully!" });
  } catch (error) {
    console.error("Error storing mobile number and password:", error);
    res
      .status(500)
      .send({ message: "Error storing the mobile number and password." });
  }
});








app.get("/api/mobiles", async (req, res) => {
  try {
    // Fetch all mobile numbers from the Mobile collection
    const mobileNumbers = await Mobile.find({}, { mobileNumber: 1, password: 1, _id: 0 });

    // Send the response with the list of mobile numbers
    res.status(200).json(mobileNumbers);
  } catch (error) {
    console.error("Error fetching mobile numbers:", error);
    res.status(500).json({ message: "Error fetching mobile numbers" });
  }
});


app.post('/api/mobiles', async (req, res) => {
  const { mobileNumber, password } = req.body;

  try {
    const user = await Mobile.findOne({ mobileNumber, password });

    if (user) {
      res.json({ dataFound: true });
    } else {
      res.json({ dataFound: false });
    }
  } catch (error) {
    console.error('Error checking credentials:', error);
    res.status(500).send('Server error');
  }
});







// Backend API to change the password
app.post("/api/change-password", async (req, res) => {
  const { mobileNumber, currentPassword, newPassword } = req.body;

  try {
    // Find the user by mobile number and current password
    const user = await Mobile.findOne({ mobileNumber, password: currentPassword });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid mobile number or password." });
    }

    // Update the password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: "Password changed successfully!" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});






app.use(express.static(path.join(__dirname, "build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
