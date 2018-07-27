const mongoose = require("mongoose");
const {ObjectID} = require("mongodb");

var Todo = mongoose.model( "Todo", {
	text: {
		type: String,
		required: true,
		minlength: 3,
		trim: true
	},
	completed: {
		type: Boolean,
		default: false
	},
	completedAt: {
		type: Number,
		default: null
	}
});

async function getTodoById(id) {
	if(!ObjectID.isValid(id)) {
	return {
		statusCode: 404, 
		body: {errorMessage: "Invalid object ID"}
		};
	}
	const todo = await Todo.findById(id);
	if(!todo) {
		return {
			statusCode: 200,
			body: {errorMessage: "No todo with corresponding ID found"}
		};
	}
	return {
		statusCode: 200,
		body: {todo}
		};
}

module.exports = {Todo, getTodoById};