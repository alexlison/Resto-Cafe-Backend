export const isAdmin = async (req, res, next) => {

    try {

        if (!req.user) {
            return res.status(401).json({
                status: "Error",
                message: "Unauthorized access"
            });
        }

        // Check admin role
        if (req.user.role !== "admin") {
            return res.status(403).json({
                status: "NOTADMIN",
                message: "Access denied. Admin can only Access."
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

