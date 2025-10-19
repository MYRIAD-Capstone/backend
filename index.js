const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const PORT = process.env.PORT;
const db = require("./models/index.js");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

db.sequelize
	.sync({ alter: true })
	.then(() => {
		console.log("Database connected successfully.");
	})
	.catch((err) => {
		console.error("Unable to connect to the database:", err);
	});

app.get("/api", (req, res) => {
	console.log(req.method, req.url);
	res.send("Welcome to the Myriad Server!");
});

app.use("/api/auth", require("./routes/auth.routes.js"));
app.use("/api/dropdown", require("./routes/dropdown.routes.js"));
app.use("/api/events", require("./routes/event.routes.js"));
app.use("/api/articles", require("./routes/article.routes.js"));
app.use("/api/doctors", require("./routes/doctor.routes.js"));
app.use("/api/appointments", require("./routes/appointment.routes.js"));
app.use("/api/messages", require("./routes/message.routes"));
app.use("/api/clients", require("./routes/client.routes.js"));
app.use("/api/admins", require("./routes/admin.routes.js"));
app.use("/api/dashboard", require("./routes/dashboard.routes.js"));
app.use("/api/notifications", require("./routes/notification.routes.js"));
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
