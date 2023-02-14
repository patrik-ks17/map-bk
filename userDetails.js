const mongoose = require('mongoose');


const MarkerTime = new mongoose.Schema({
	start: String,
	end: String
}, {
	collection: "UserInfo"
})

const UserMarkerSchema = new mongoose.Schema({
	lat: Number,
	lng: Number,
	sport: String,
	time: {type: Object, ref: 'MarkerTime'}
}, {
	collection: "UserInfo",
	timestamps: true,
	strict: true
});

const UserDetailsSchema = new mongoose.Schema({
	username:{type:String, required:true},
	email:{type:String, unique:true, required:true},
	password:{type:String, required:true},
	usertype:String,
	markers: [{type: Object, ref: "UserMarkers"}]
}, {
	collection: "UserInfo",
});


mongoose.model('MarkerTime', MarkerTime);
mongoose.model('UserMarkers', UserMarkerSchema);
mongoose.model('UserInfo', UserDetailsSchema);