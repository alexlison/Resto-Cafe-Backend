import {

    addIngredientService,
    editIngredientService,
    getAllIngredientService,
    toggleIngredientStatusService

} from "../services/ingredient.services.js";


// Add Ingredient
export const addIngredient = async(req,res)=>{

try{

    const ingredientData =
    req.body;

    let imageUrl=null;

    if(req.file){

        imageUrl=
        `/ingredients/${req.file.filename}`;

    }

    const result=
    await addIngredientService(
        ingredientData,
        imageUrl
    );

    return res.status(201).json({

        status:"SUCCESS",
        message:
        "Ingredient added successfully",

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



// Edit Ingredient


export const editIngredient =
async(req,res)=>{

try{

    const updateData =
    req.body;

    let imageUrl=null;

    if(req.file){

        imageUrl=
        `/ingredients/${req.file.filename}`;

    }

    const result=
    await editIngredientService(

        req.params.id,
        updateData,
        imageUrl

    );

    return res.status(200).json({

        status:"SUCCESS",
        message:
        "Ingredient updated successfully",

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


// View All Ingredient
export const viewAllIngredient = async(req,res)=>{

    try{

        const result=
        await getAllIngredientService();

        return res.status(200).json({
            status:"SUCCESS",
            message:"Ingredient retrieved successfully",
            data:result
        });

    }catch(error){

        return res.status(500).json({
            status:"FAILED",
            message:error.message
        });

    }

};


// Toggle Ingredient Status
export const toggleIngredientStatus = async(req,res)=>{

    try{

        const result=
        await toggleIngredientStatusService(
            req.params.id
        );

        return res.status(200).json({
            status:"SUCCESS",
            message:"Ingredient status updated",
            data:result
        });

    }catch(error){

        return res.status(500).json({
            status:"FAILED",
            message:error.message
        });

    }

};