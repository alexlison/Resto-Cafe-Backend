import {

  addRecipeService,
  editRecipeService,
  getAllRecipeService,
  toggleRecipeStatusService

} from "../services/recipe.services.js";


// Add Recipe
export const addRecipe =
async(req,res)=>{

try{

    const recipeData =
    req.body;


    // Convert recipeItems string → array
    if(

        recipeData.recipeItems &&
        typeof recipeData.recipeItems
        === "string"

    ){

        recipeData.recipeItems =
        JSON.parse(
            recipeData.recipeItems
        );

    }


    let imageUrl = null;

    if(req.file){

        imageUrl =
        `/recipes/${req.file.filename}`;

    }


    const result =
    await addRecipeService(

        recipeData,
        imageUrl

    );

    return res.status(201).json({

        status:"SUCCESS",

        message:
        "Recipe added successfully",

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




// Edit Recipe
export const editRecipe =
async(req,res)=>{

try{

    const updateData =
    req.body;


    // Convert recipeItems string → array
    if(

        updateData.recipeItems &&
        typeof updateData.recipeItems
        === "string"

    ){

        updateData.recipeItems =
        JSON.parse(
            updateData.recipeItems
        );

    }


    let imageUrl = null;

    if(req.file){

        imageUrl =
        `/recipes/${req.file.filename}`;

    }


    const result =
    await editRecipeService(

        req.params.id,
        updateData,
        imageUrl

    );

    return res.status(200).json({

        status:"SUCCESS",

        message:
        "Recipe updated successfully",

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

// View All Recipe
export const viewAllRecipe = async (req, res) => {

  try {

    const result =
      await getAllRecipeService();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Recipe data retrieved successfully",
      data: result
    });

  } catch (error) {

    return res.status(500).json({
      status: "FAILED",
      message: error.message
    });

  }

};


// Toggle Recipe Status
export const toggleRecipeStatus = async (req, res) => {

  try {

    const result =
      await toggleRecipeStatusService(
        req.params.id
      );

    return res.status(200).json({
      status: "SUCCESS",
      message: "Recipe status updated successfully",
      data: result
    });

  } catch (error) {

    return res.status(500).json({
      status: "FAILED",
      message: error.message
    });

  }

};