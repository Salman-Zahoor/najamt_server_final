const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const Admin = require("../model/admin");
const Employee = require("../model/employee");
const Services = require("../model/services");
const Bookings = require("../model/bookings");
const jwt = require("jsonwebtoken");
const JWT_SECRET =
  "7287sjhjh8hjshjhjshh76@@@#452454525454fgfDF##$#@#45443453fdfdrE#434SwwwW$@#@#$#@%@%$%@$@%@^&hgHG77gy767yty";


router.get("/getAdmin",async (req, res) => {
    try {
      const result = await Admin.find();
      res.status(200).send({ data: result, status: "ok" });
    } catch (error) {
      res.status(400).send({
        status: "error",
        message: "Something went wrong",
      });
    }
  });

router.post("/registerAdmin", async (req, res) => {
  const { email, password, name, image } = req.body;
  let pass = await bcrypt.hash(password, 10); //10 hashing rounds
  try {
    const result = await Admin.create({
      email,
      password: pass,
      name,
      image,
    });
    res.status(200).json({
      status: "ok",
      message: "Admin created successfully.",
    });
  } catch (error) {
    if (error.code == 11000) {
      //11000 => error for duplicate key
      return res.status(400).json({
        status: "error",
        message: "email or phone already in use",
      });
    }
    return res.status(400).json({
      status: "error",
      message: "something went wrong",
    });
  }
});

router.post("/loginAdmin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await Admin.findOne({ email });
    console.log(user, "USER=>>>>>");
    if (!user) {
      return res.status(400).send({
        status: "error",
        message: "email not found",
      });
    } else {
      if (await bcrypt.compare(password, user?.password)) {
        const token = jwt.sign(
          {
            id: user?._id,
            name: user?.name,
          },
          JWT_SECRET
        );

        user["password"] = null;
        const params = {
          token: token,
          userDetails: user,
        };
        return res.status(200).json({
          status: "ok",
          data: params,
        });
      } else {
        res
          .status(400)
          .send({ status: "error", message: "Invalid email or password" });
      }
    }
  } catch (error) {
    res.status(400).send({ status: "error", message: "Something went wrong" });
  }
});

router.post("/changePasswordAdmin", async (req, res) => {
  const { email, password, newPassword } = req.body;
  try {
    let result = await Admin.findOne({ email });
    if (result) {
      if (await bcrypt.compare(password, result.password)) {
        let hashedPassword = await bcrypt.hash(newPassword, 10);
        let updateUser = await Admin.updateOne(
          { _id: result._id },
          { $set: { password: hashedPassword } }
        );
        res
          .status(200)
          .send({ status: "ok", message: "Password updated Successfully" });
      } else {
        res.status(400).send({
          status: "error",
          message: "Current Password is Invalid",
        });
      }
    } else {
      res.status(400).send({
        status: "error",
        message: "Something went wrong",
      });
    }
  } catch (error) {
    res.status(400).send({
      status: "error",
      message: "Something went wrong",
    });
  }
});

router.get("/adminDashboard", async (req, res) => {
    try {
      let allEmployee = await Employee.find();
      let allServices = await Services.find();
      let allBookings = await Bookings.find();
    

      const bokingsChart = await Bookings.aggregate([
        {
          $group: {
            _id: {
              $dateToString: {
                date: { $dateFromString: { dateString: "$date" } },
                format: "%m",
              },
            },
            numberofbookings: { $sum: 1 },
          },
        },
      ]);
      let params = {
        allEmployee: allEmployee?.length,
        allServices: allServices?.length,
        allBookings: allBookings?.length,
        bokingsChartData: bokingsChart,
      };
      res.status(200).send({
        data: params,
        status: "ok",
      });
    } catch (error) {
      console.log(error, "ERRRRRRRRRRRRRR");
      res.status(400).send({
        status: "error",
      });
  }}
);


module.exports = router;