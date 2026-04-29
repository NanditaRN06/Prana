// backend/controllers/userController.js
const User = require("../models/User");

exports.getAccount = async (req, res) => {
    try {
        if (!req.user || !req.user.id) return res.status(400).json({ message: "User is not authenticated" });
        const user = await User.findById(req.user.id, "-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ message: "Server error" }); 
    }
};

exports.updateAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.fullName = req.body.fullName !== undefined ? req.body.fullName : user.fullName;
        user.email = req.body.email !== undefined ? req.body.email : user.email;
        if (req.body.phoneNumber === "") { user.phoneNumber = undefined; }
        else if (req.body.phoneNumber !== undefined) { user.phoneNumber = req.body.phoneNumber; }
        
        user.department = req.body.department !== undefined ? req.body.department : user.department;
        user.position = req.body.position !== undefined ? req.body.position : user.position;
        user.qualifications = req.body.qualifications !== undefined ? req.body.qualifications : user.qualifications;
        user.consultationAddress = req.body.consultationAddress !== undefined ? req.body.consultationAddress : user.consultationAddress;
        user.consultationHospital = req.body.consultationHospital !== undefined ? req.body.consultationHospital : user.consultationHospital;
        
        if (req.body.kmcNumber === "") {
            user.kmcNumber = undefined;
        } else if (req.body.kmcNumber !== undefined) {
            const existingKmc = await User.findOne({ kmcNumber: req.body.kmcNumber, _id: { $ne: req.user.id } });
            if (existingKmc) return res.status(400).json({ message: "This KMC Number is already registered." });
            user.kmcNumber = req.body.kmcNumber;
        }

        await user.save();
        res.json({ message: "Profile updated successfully", user });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ message: "Server error" }); 
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ message: "Account deleted successfully" });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ message: "Server error" }); 
    }
};

exports.deactivateAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        user.status = "deactivated";
        await user.save();
        res.clearCookie('token');
        res.json({ message: "Account deactivated successfully." });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ message: "Server error" }); 
    }
};
