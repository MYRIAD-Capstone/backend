const db = require("../models");
const Field = db.Field;
const Doctor = db.Doctor;

exports.getActiveFields = async (req, res) => {
  try {
    const fields = await Field.findAll({
      where: { required: true }, // or `status: 'active'` if you have that
      order: [["name", "ASC"]],
    });

    res.status(200).json(fields);
  } catch (error) {
    console.error("Error fetching fields:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch fields", error: error.message });
  }
};

exports.getActiveDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.findAll({
      where: { status: "enabled" }, // only active doctors
      include: [
        {
          model: Field,
          as: "field",
          attributes: ["field_id", "name"],
        },
      ],
      order: [["first_name", "ASC"]],
      attributes: ["doctor_id", "first_name", "last_name", "field_id"], // only necessary fields
    });

    res.status(200).json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch doctors", error: error.message });
  }
};
