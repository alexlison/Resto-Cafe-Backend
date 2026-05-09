import jwt from "jsonwebtoken";

export const authenticate = (req,res) => {

    try {

        const token = req.headers.token;

        if(!token) {

            return res.status(401).json({
                status:"FAILED",
                message:"Token Missing"
            });
        }

        const decoded = jwt.verify(token,process.env.JWT_SECRET);

           // normalize user
        // req.user = {
        //    userId: decoded.userId || decoded.id,
        //    role: decoded.role
        //  }; 

        next();

    } catch (error) {
      
        console.error("JWT ERROR:", error.message);

     return res.status(401).json({
      status: "FAILED",
      message: "Invalid or expired token"
    });
        
    }
    
};