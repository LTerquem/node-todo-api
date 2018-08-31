const {ObjectId} = require("mongodb");
const jwt = require("jsonwebtoken");

const {Todo} = require("./../../models/todo");
const {User} = require("./../../models/user");

const todoId = "5b598f0849ffcf1acc0b6326";
const otherTodoId = new ObjectId();

const userId = new ObjectId();
const otherUserId = new ObjectId();

const seedTodos = [{
	_id : todoId,
	text: "first test todo"
}, {
	_id: otherTodoId,
	text: "second test todo",
	completed: true,
	completedAt: 666
}]

const seedUsers = [
	{
		_id: userId,
		email: "aze@gmail.com",
		password: "password123",
		tokens: [{
			access:"auth",
			token: jwt.sign({_id: userId.toHexString(), access: "auth"}, "abc123").toString()
		}]
	},
	{
		_id: otherUserId,
		email: "azer@gmail.com",
		password: "password456"
	}
]

const populateTodos = (done) => {
	Todo.remove({})
		.then( () => Todo.insertMany(seedTodos))
		.then( () => done());
}

const populateUsers = done => {
	User.remove({})
		.then( () => {
			var userOne = new User(seedUsers[0]).save();
			var userTwo = new User(seedUsers[1]).save();

			Promise.all([userOne, userTwo]).then( () => done());
		})
}

module.exports = {seedTodos, populateTodos, seedUsers, populateUsers}