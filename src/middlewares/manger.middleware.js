export const isManager = async (req, res, next) => {

    try {

        if (!req.user) {
            return res.status(401).json({
                status: "Error",
                message: "Unauthorized access"
            });
        }

        // Check admin role
        if (req.user.role !== "manager") {
            return res.status(403).json({
                status: "NOTMANAGER",
                message: "Access denied. Manager can only Access."
            });
        }

        next();

    } catch (error) {

        return res.status(500).json({
            status: "Error",
            message: error.message || "Server Error"
        });

    }

};

