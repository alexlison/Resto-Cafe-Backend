// purchase.services.js

import purchases from "../models/purchase.model.js";
import purchaseBatches from "../models/purchaseBatch.model.js";

import vendors from "../models/vendor.model.js";
import ingredients from "../models/ingredient.model.js";


// ========================
// Generate Batch Number
// ========================

const generateBatchNumber = async (
    ingredientName
) => {

    const ingredientTag =
        ingredientName
        .replace(/\s+/g, "")
        .toUpperCase();


    const lastBatch =
        await purchaseBatches
        .findOne({

            batchNumber: {
                $regex:
                `^${ingredientTag}-BAT-`
            }

        })
        .sort({
            createdAt: -1
        });


    let nextSequence = 1001;


    if (lastBatch) {

        const lastNumber =
            parseInt(

                lastBatch.batchNumber
                .split("-")
                .pop()

            );

        nextSequence =
            lastNumber + 1;

    }


    return `${ingredientTag}-BAT-${nextSequence}`;

};


// Add Purchase

export const addPurchaseService =
async (data) => {

    const session =
        await purchases.startSession();

    session.startTransaction();

    try {

        const {
            vendorId,
            totalAmount,
            purchaseItems
        } = data;


        // Vendor validation
        const vendor =
            await vendors.findById(
                vendorId
            );

        if (!vendor) {

            throw new Error(
                "Vendor not found"
            );

        }


        // Validate everything first

        for (const item of purchaseItems) {

            const ingredient =
                await ingredients.findById(
                    item.ingredientId
                );

            if (!ingredient) {

                throw new Error(
                    "Ingredient not found"
                );

            }

            // Expiry validation
            if (

                new Date(
                    item.expiryDate
                ) <=

                new Date(
                    item.manufacturingDate
                )

            ) {

                throw new Error(

                    `Invalid dates for ${ingredient.ingredientName}`

                );

            }


            // Duplicate validation
            const duplicate =
                await purchaseBatches.findOne({

                    ingredientId:
                        item.ingredientId,

                    manufacturingDate:
                        new Date(
                            item.manufacturingDate
                        ),

                    expiryDate:
                        new Date(
                            item.expiryDate
                        )

                });

            if (duplicate) {

                throw new Error(

                    `${ingredient.ingredientName} batch already exists`

                );

            }

        }


        // Create purchase

        const purchase =
            await purchases.create(
                [{
                    vendorId,
                    totalAmount
                }],
                { session }
            );


        // Insert all batches

        for (const item of purchaseItems) {

            const ingredient =
                await ingredients.findById(
                    item.ingredientId
                );

            const batchNumber =
                await generateBatchNumber(
                    ingredient.ingredientName
                );

            await purchaseBatches.create(
                [{

                    purchaseId:
                        purchase[0]._id,

                    ingredientId:
                        item.ingredientId,

                    batchNumber,

                    quantity:
                        item.quantity,

                    unitCost:
                        item.unitCost,

                    totalCost:
                        item.totalCost,

                    manufacturingDate:
                        item.manufacturingDate,

                    expiryDate:
                        item.expiryDate,

                    remainingQuantity:
                        item.quantity

                }],
                { session }
            );

        }


        await session.commitTransaction();

        session.endSession();

        return purchase[0];

    }
    catch (error) {

        await session.abortTransaction();

        session.endSession();

        throw error;

    }

};


// View Purchase

export const getAllPurchaseService =
async () => {

    const purchaseList =
        await purchases.aggregate([

            // Vendor Join

            {
                $lookup: {

                    from: "vendors",

                    localField:
                    "vendorId",

                    foreignField:
                    "_id",

                    as: "vendor"

                }
            },

            {
                $unwind:
                "$vendor"
            },


            // Purchase Batch Join

            {
                $lookup: {

                    from:
                    "purchasebatches",

                    localField:
                    "_id",

                    foreignField:
                    "purchaseId",

                    as:
                    "purchaseItems"

                }
            },


            // Ingredient Join

            {
                $lookup: {

                    from:
                    "ingredients",

                    localField:
                    "purchaseItems.ingredientId",

                    foreignField:
                    "_id",

                    as:
                    "ingredients"

                }
            },


            // Final Response

            {
                $project: {

                    purchaseDate: 1,

                    vendorName:
                    "$vendor.vendorName",

                    totalBillAmount:
                    "$totalAmount",

                    purchaseItems: {

                        $map: {

                            input:
                            "$purchaseItems",

                            as:
                            "item",

                            in: {

                                ingredientName: {

                                    $arrayElemAt: [

                                        "$ingredients.ingredientName",

                                        {

                                            $indexOfArray: [

                                                "$ingredients._id",

                                                "$$item.ingredientId"

                                            ]

                                        }

                                    ]

                                },

                                batchNumber:
                                "$$item.batchNumber",

                                quantity:
                                "$$item.quantity",

                                unitPrice:
                                "$$item.unitCost",

                                totalPrice:
                                "$$item.totalCost",

                                manufacturingDate:
                                "$$item.manufacturingDate",

                                expiryDate:
                                "$$item.expiryDate"

                            }

                        }

                    }

                }

            }

        ]);

    return purchaseList;

};