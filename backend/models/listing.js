const mongoose =require('mongoose');
const Review = require('./review');
const Schema = mongoose.Schema;


const listingScheama = new Schema({ 
 title:{
            type:String,
            required:true,
    },
description:{
    type:String,
},
image :{
   url:String,
   filename:String,
},
images: [
  {
    url: String,
    filename: String
  }
],
 price:{
    type:Number,
},
location:{
    type:String,
},
country:{
    type:String,
},
reviews:[
{   
    type: Schema.Types.ObjectId,
    ref:"Review",
}
],
type: {
  type: String,
  default: "Villa"
},
owner:{
    type:Schema.Types.ObjectId,
    ref:"User",
},
geometry: {
    type: {
      type: String,
      enum: ["Point"],
      required: true
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  }
});

listingScheama.post("findOneAndDelete",async(listing)=>{
    if(listing){
     await Review.deleteMany({_id:{$in:listing.reviews}});

    }
})

const Listing = mongoose.model("Listing",listingScheama);

module.exports = Listing;