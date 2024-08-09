const mongoose=require('mongoose')

const ProductSchema= new mongoose.Schema({
    id:{
        type:Number,
        required:true,
    },
    name:{
        type:String,
        required:true,
    },
    category:{
        type:String,
        required:true,
    },
    subcategory:String,
    description:{
        type:String,
        
    },
    image:{
        type:String,
        required:true,

    },
    new_price:{
        type:Number,
        required:true,
    },
    old_price:{
        type:Number,
        required:true,
    },
    date:{
        type:Date,
        default:Date.now(),
    },
    available:{
        type:Boolean,
        default:true,
    }

})
const Product= mongoose.model("product",ProductSchema);
module.exports=Product;