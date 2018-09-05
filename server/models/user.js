const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const bcrypt = require("bcryptjs");

var UserSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		trim: true,
		minlength: 3,
		unique: true,
		validate: {
			validator: value => validator.isEmail(value),
			message: "{VALUE} is not a valid email !"
		}
	},
	password: {
		type: String,
		require: true,
		minlength: 6
	},
	tokens: [{
		access: {
			type: String,
			require: true
		},
		token: {
			type: String,
			require: true
		}
	}]
})

UserSchema.methods.toJSON = function () {
	var user = this;
	var userObject = user.toObject();
	return _.pick(userObject, ["_id", "email"]);
}

UserSchema.methods.generateAuthToken = function () {
	var user = this;
	var access = "auth";
	var token = jwt.sign({_id: user._id.toHexString(), access}, "abc123").toString();

	user.tokens.push({access, token});

	return user.save().then( () => {
		return token;
	});
}

UserSchema.methods.removeAuthToken = function(tokenToRemove) {
	var user = this;
	return user.update({
		$pull : {
			tokens: {token: tokenToRemove}
		}
	});
}

UserSchema.pre("save", function(next) {

	if(this.isModified("password")) {
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(this.password, salt, (err, hash) => {
				this.password = hash;	
				next();
			});
		});
	} else {
		next();
	}
});

UserSchema.statics.findByToken = function (token) {
	var User = this;
	var decoded;
	try {
		decoded = jwt.verify(token, "abc123");
	} catch (e) {
		return Promise.reject("Token authentication error");
	}
	return User.findOne({
		"_id" : decoded._id,
		"tokens.token": token,
		"tokens.access": "auth"
	});
}

UserSchema.statics.findByCredentials = function (email, password) {
	var User = this;
	return User.findOne({email}).then( user => {
		if (!user) {
			return Promise.reject("No matching user found")
		}

		return new Promise( (resolve, reject) => {
			bcrypt.compare(password, user.password, (err, res) => {
				if(res) {
					resolve(user);
				} else {
					reject("Password incorrect");
				}
			});
		})
	})
}

var User = mongoose.model("User", UserSchema );

module.exports = {User};