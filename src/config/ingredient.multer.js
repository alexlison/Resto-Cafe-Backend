import multer from "multer";

const storage = multer.diskStorage({

    destination:(req,file,cb)=>{

        return cb(
            null,
            "./ingredients"
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

const uploadIngredient =
multer({
    storage
});

export default uploadIngredient;