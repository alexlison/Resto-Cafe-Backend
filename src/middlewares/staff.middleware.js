export const isStaff = async (req, res, next) => {

    try {

        // Check authenticated user
        if (!req.user) {

            return res.status(401).json({
                status: "UNAUTHORIZED",
                message: "Unauthorized access"
            });

        }

        // Check staff role
        if (req.user.role !== "staff") {

            return res.status(403).json({
                status: "NOTSTAFF",
                message: "Access denied. Staff only."
            });

        }

        next();

    } catch (error) {

        return res.status(500).json({
            status: "FAILED",
            message: error.message || "Server Error"
        });

    }

};