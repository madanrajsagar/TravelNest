const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONFGO_URL="mongodb://127.0.0.1:27017/wanderlust";

main()
.then(()=>console.log("Connected to MongoDB"))
.catch(err=>console.log(err));

async function main(){
    await mongoose.connect(MONFGO_URL);;
}



const initDB = async()=>{
    await Listing.deleteMany({});
   initData.data= initData.data.map((obj)=>( {
    ...obj,
    owner:"69451cf38edc03bd2248d4c0" ,
}));

    await Listing.insertMany(initData.data);
    console.log("Data was initialized!");

};

initDB();