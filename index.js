const express=require('express');
const mongoose=require('mongoose');
const cors=require('cors');
const multer=require('multer')
const path=require('path')
const jwt=require('jsonwebtoken')
require('dotenv').config();
const Product=require('./models/product')
const User=require('./models/user')
const Category = require('./models/Categories');
const port=process.env.PORT||4000;
const app=express();

app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cors());
app.use('/images',express.static('uploads/images'));

const storage=multer.diskStorage({
    destination:"./uploads/images",
    filename:(req,file,cb)=>{
return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})
const upload=multer({
    storage
});

mongoose.connect(process.env.MONGO_URL).then(()=>{
    console.log("mongodb connected successfully")
});
app.listen(port,()=>{
    console.log(`server started at port no.${port}`);
})

app.get('/',(req,res)=>{
     res.send("<h1>Hello you are on Home Page</h1>");
})
app.get('/favicon.ico',(req,res)=>{
  res.end();
})

app.post('/upload',upload.single('product'),(req,res)=>{
res.json({
    success:1,
    image_url:`http://localhost:4000/images/${req.file.filename}`
})
})
app.post('/uploadcategory',upload.single('categoryimage'),(req,res)=>{
    res.json({
        success:1,
        image_url:`http://localhost:4000/images/${req.file.filename}`
    })
})
app.post('/addcategory',async (req,res)=>{
   const {name,image,subcategories}=req.body;
   const arr=[];
   subcategories.split(",").map((item)=>{
    arr.push({name:item});
   })
    const prev=await Category.findOne({name:name});
    if(prev){
        const ar=[];
        arr.map((i)=>{
            if(!(prev.subcategories.find((item)=>item.name===i.name))){
                prev.subcategories.push({name:i.name});
            }
        })

        const category=await Category.updateOne({name:name},prev);
  res.json(category);
    }
    else{
    const category=await Category.create({
    name:name,
    image:image,
    subcategories:arr,
  })
  
  res.json(category);
}

})
app.post('/addproduct',async (req,res)=>{
    let products=await Product.find({});
    let id;
    if(products.length>0){
        let last_product=products[products.length-1];
        id=last_product.id+1;
    }
    else id=1;

const product=new Product({
id:id,
name:req.body.name,
image:req.body.image,
category:req.body.category,
new_price:req.body.new_price,
old_price:req.body.old_price,

})
await product.save();
res.json({
    success:1,
    name:product.name
})
})
app.post('/removeproduct',async (req,res)=>{
    const p=await Product.findOneAndDelete({id:req.body.id});
    res.json({
        success:1,
        name:p.name,
    })
})

app.get('/allproducts',async (req,res)=>{
    let products=await Product.find({});
    res.send(products);
})

app.get('/allcategories',async (req,res)=>{
    let categories=await Category.find({});
    
    res.send(categories);
})

app.post('/signup',async (req,res)=>{
const {username,email,password}=req.body;
 if(!email&&!email.includes('@gmail.com')&&!email.includes('@reddif.com')&&!email.includes('@hotmail.com')&&!email.incluse('@yahoo.com')&&!email.includes('@outlook.com')){
      res.status(400).json({success:false,error:'Please Enter valid E-mail'});

 }
let check=await User.findOne({
    email:email
})
if(!check){
     let cart={};
         for(let i=0;i<=40;i++){
            cart[i]=0;
         }
      try{   
         await User.insertMany({
            name:username,
            email:email,
            password:password,
            cartData:cart,
         })
         const user=await User.findOne({email:email});
         const payload={
            email:email,
         }
         const token=jwt.sign(payload,"secret_key",{expiresIn:"2 h"});
         console.log(token);
         res.json({success:true,token,name:user.name});
        }
        catch(error){
             res.status(400).json({success:false,error:'All fields are required'});
        }

         


}
else res.status(400).json({success:false,error:"User with same email already exists"});


})

app.post('/login',async (req,res)=>{
let user=await User.findOne({email:req.body.email});
if(user){
    if(user.password===req.body.password){
        const data={
            email:user.email,
        }
        const token=jwt.sign(data,"secret_key",{expiresIn:"2 h"});
        res.json({success:true,token,name:user.name});
    }
    else{
        res.json({success:false,error:"wrong password"});
    }
}
else{
    res.json({success:false,error:"User not registered"});
}

})

app.get('/popular',async (req,res)=>{
    const allproduct=await Product.find({});
    const popular=allproduct.slice(0,4);
    res.send(popular);
})

app.get('/newcollections',async (req,res)=>{
    const allproduct=await Product.find({});
   
    
    const newcoll=[];
    let count=0;
    for(let i=allproduct.length-1;i>=0&&count<=11;i--){
        count++;
        newcoll.push(allproduct[i]);
    }
   
    res.send(newcoll);
})
  const fetchUser=async (req,res,next)=>{
   const token=req.header('token');
    
   if(!token){
    res.status(400).json({error:"Please Login First"});
   }
   else{
      try{
        let data;
        data= jwt.verify(token,"secret_key");
        req.user=data.email;
        console.log(data);
        next();
      }
      catch(error){
         console.log("error encountered");
      }
   }
  }
app.post('/addtocart',fetchUser,async (req,res)=>{

      let user=await User.findOne({email:req.user});
    
      user.cartData[req.body.itemId]+=req.body.qty;
      if(user.cartData[req.body.itemId]<0){
        user.cartData[req.body.itemId]=0;
      }
       await User.findOneAndUpdate({email:req.user},{
        cartData:user.cartData
      })
      
      res.json({data:user.cartData});
     
})
app.post('/cart',fetchUser,async (req,res)=>{
    const token=req.header('token');

    console.log(jwt.verify(token,'secret_key'));
    const user=await User.findOne({email:req.user});
    console.log(user);
    res.send(user.cartData);
})

app.post('/delete',fetchUser,async (req,res)=>{
    const id=req.body.itemId;
    const user=await User.findOne({email:req.user});
    console.log(user);
  const cart=user.cartData;
  console.log(cart);
 
  if(cart[id]>0){
    console.log(cart[id]);
   cart[id]=cart[id]-1;
  }
    await User.findOneAndUpdate({email:req.user},{cartData:cart});

      const updated_user=await User.findOne({email:req.user});
      
      res.json(updated_user.cartData);
})

app.post('/update',async (req,res)=>{
    await Product.updateMany({name:'Men Green Solid Zippered Full-Zip Slim Fit Bomber Jacket'},{subcategory:'mens-wear'});
    await Product.updateMany({name:'Boys Orange Colourblocked Hooded Sweatshirt'},{subcategory:'Kids'});
    await Product.updateMany({name:'Striped Flutter Sleeve Overlap Collar Peplum Hem Blouse'},{subcategory:'women-wear'});
    await Product.updateMany({},{description:"A lightweight, usually knitted, pullover shirt, close-fitting and having a round neckline and short sleeves, worn as an undershirt or outer garment"});
    res.send('successfully updated');
})

app.post('/search',upload.none(),async (req,res)=>{
   
    let {search,indescription,category,insubcategory}=req.body;
  
  search=search.toLowerCase();
  console.log(search);
  console.log(category);
    let result;
    if(category==="All Category"){
        const withcategory=await Product.find({});
        console.log(withcategory);
        if(indescription==='true'){
        result=withcategory.filter((item)=> (item.name.toLowerCase().includes(search)||item.description.toLowerCase().includes(search)));
        }
        else{
            result=withcategory.filter((item)=> (item.name.toLowerCase().includes(search)));
        }

    }
    else{
        const smallcategory=category.toLowerCase();
        console.log(smallcategory);
        console.log(category);
        let cat=await Category.find({name:category});
  
        if(cat.length>0){
           if(indescription==='true'){

             
            const withcategory=await Product.find({category:smallcategory});
            console.log(withcategory);
            
            result=withcategory.filter((item)=> (item.name.toLowerCase().includes(search)||item.description.toLowerCase().includes(search)));
           }
           else{
            const withcategory=await Product.find({category:category});
             result=withcategory.filter((item)=> item.name.toLowerCase().includes(search));
           }

        
        
    }
    else{
        if(insubcategory==='true'){
            if(indescription==='true'){
             const withsubcategory=await Product.find({subcategory:category});
             console.log(withsubcategory);
             result=withsubcategory.filter((item)=> (item.name.toLowerCase().includes(search)||item.description.toLowerCase().includes(search)));
             console.log(result); 
            }
            else{
                const withsubcategory=await Product.find({subcategory:category});
                result=withsubcategory.filter((item)=> (item.name.toLowerCase().includes(search)));
            }
        }
        else{
            result=[]
        }
       
    }
}
    console.log(result);
    res.send(result);

    
})








