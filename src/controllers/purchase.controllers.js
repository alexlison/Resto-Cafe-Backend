import {

    addPurchaseService,
    getAllPurchaseService

} from "../services/purchase.services.js";


// Add Purchase
export const addPurchase =
async(req,res)=>{

    try{

        const result =
        await addPurchaseService(
            req.body
        );

        return res.status(201).json({

            status:"SUCCESS",
            message:
            "Purchase added successfully",

            data:result

        });

    }
    catch(error){

        return res.status(500).json({

            status:"FAILED",
            message:error.message

        });

    }

};


// View All Purchase
export const viewAllPurchase =
async(req,res)=>{

    try{

        const result =
        await getAllPurchaseService();

        return res.status(200).json({

            status:"SUCCESS",
            message:
            "Purchase data retrieved successfully",

            data:result

        });

    }
    catch(error){

        return res.status(500).json({

            status:"FAILED",
            message:error.message

        });

    }

};