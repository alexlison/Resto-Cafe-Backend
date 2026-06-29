import multer from "multer";

const storage = multer.diskStorage({

    destination:(req,file,cb)=>{

        return cb(
            null,
            "./recipes"
        );

    },

    filename:(req,file,cb)=>{

        return cb(

            null,

            Date.now()+
            "-" +
            file.originalname

        );

    }

});

const uploadRecipe =
multer({
    storage
});

export default uploadRecipe;