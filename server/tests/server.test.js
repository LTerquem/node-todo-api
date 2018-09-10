const expect = require("expect");
const request = require("supertest");
const jwt = require("jsonwebtoken")
const {ObjectId} = require("mongodb");

const {app} = require("./../server");
const {Todo} = require("./../models/todo");
const {User} = require("./../models/user");

const {seedTodos, populateTodos, seedUsers, populateUsers} = require("./seed/seed");

beforeEach(populateUsers);
beforeEach(populateTodos);

describe("POST /todo", () => {
	it("should create a new todo", done => {
		var text = "Test ToDo creation";
		request(app)
			.post("/todos")
			.set("x-auth",seedUsers[0].tokens[0].token)
			.send({text})
			.expect(200)
			.expect( res => expect(res.body.text).toBe(text))
			.end((err, res) => {
				if(err) {
					return done(err);
				}

				Todo.find()
					.then(todos => {
						expect(todos.length).toBe(3);
						expect(todos[2].text).toBe(text);
						done();
					}).catch( err => done(err));
			});
	});

	it("should not create a todo - invalid body data", done => {
		request(app)
			.post("/todos")
			.set("x-auth",seedUsers[0].tokens[0].token)
			.send({})
			.expect(400)
			.end( (err, res) => {
				if(err) {
					return done(err);
				}
				Todo.find()
					.then( todos => {
						expect(todos.length).toBe(2);
						done();
					}).catch( err => done(err))
			});
	});
});

describe("GET /todos", () => {
	it("should return an object with todos property ", done => {
		request(app)
			.get("/todos")
			.set("x-auth",seedUsers[0].tokens[0].token)
			.expect(200)
			.expect(res => expect(res.body.todos.length).toBe(1))
			.end(done);
	});

	describe("GET /todos/id", () => {
		it("should return a single Todo", done => {
			request(app)
				.get(`/todos/${seedTodos[0]._id}`)
				.set("x-auth",seedUsers[0].tokens[0].token)
				.expect(200)
				.expect(res => expect(res.body.todo).toBeTruthy())
				.end(done);
		});

		it("should return a 404", done => {
			request(app)
				.get(`/todos/${seedTodos[0]._id}111`)
				.set("x-auth",seedUsers[0].tokens[0].token)
				.expect(404)
				.expect(res => expect(res.body.todo).toBeFalsy()) //Should not return any Todos
				.expect(res => expect(res.body.errorMessage).toBeTruthy()) //Should return an error message
				.end(done);
		});

		it("should return an error message with a 404", done => {
			request(app)
				.get(`/todos/${new ObjectId()}`)
				.set("x-auth",seedUsers[0].tokens[0].token)
				.expect(404)
				.expect(res => expect(res.body.todo).toBeFalsy()) //Should not return any Todos
				.expect(res => expect(res.body.errorMessage).toBe("Todo not found"))	//Should return an error message
				.end(done);
		});

		it("should not be able to access a todo made by another user", done => {
			request(app)
				.get(`/todos/${seedTodos[0]._id}`)
				.set("x-auth",seedUsers[1].tokens[0].token)
				.expect(404)
				.expect(res => expect(res.body.todo).toBeFalsy()) //Should not return any Todos
				.expect(res => expect(res.body.errorMessage).toBeTruthy()) //Should return an error message
				.end(done);
		});
	});
})

describe("DELETE /todos", () => {
	it("should delete a todo", done => {
		request(app)
			.delete(`/todos/${seedTodos[0]._id}`)
			.set("x-auth",seedUsers[0].tokens[0].token)
			.expect(200)
			.end(res => {
				Todo.find().then(todos => {
					expect(todos.length).toBe(1);
					expect(todos[0].text).toBe("second test todo");
					Todo.findById(seedTodos[0]._id).then(todo => {
						expect(todo).toBeNull();
						done();
					});
				});
			});
	});

	it("should not be able to delete a todo created by another user", done => {
		request(app)
			.delete(`/todos/${seedTodos[1]._id}`)
			.set("x-auth",seedUsers[0].tokens[0].token)
			.expect(404)
			.end(res => {
				Todo.find().then(todos => {
					expect(todos.length).toBe(2);
					done();
				});
			});
	});

	it("should say that no matching todo was found", done => {
		request(app)
			.delete(`/todos/${new ObjectId()}`)
			.set("x-auth",seedUsers[0].tokens[0].token)
			.expect(404)
			.expect(res => {
				Todo.find().then(todos => expect(todos.length).toBe(2));
				expect(res.body.errorMessage).toBe("Todo not found");
			})
			.end(done);
	});

	it("should return a 404", done => {
		request(app)
			.delete("/todos/1")
			.set("x-auth",seedUsers[0].tokens[0].token)
			.expect(404)
			.expect(res => expect(res.body.errorMessage).toBe("Invalid Object ID"))
			.end(done);
	});

	it("should delete all todos", done => {
		request(app)
			.delete("/todos")
			.expect(200)
			.set("x-auth",seedUsers[0].tokens[0].token)
			.end((err, res) => {
				if(err) {
					return done(err);
				}
				Todo.find({_creator: seedUsers[0]._id}).then(todos => expect(todos.length).toBe(0));
				done();
			});
	});
});

describe("PATCH /todos/:id", () => {
	it("should update the todo", done => {
		request(app)
		.patch(`/todos/${seedTodos[0]._id}`)
		.set("x-auth",seedUsers[0].tokens[0].token)
		.send({"text": "updated text", "completed": true})
		.expect(200)
		.end( (err, res) => {
			if(err) {
				return done(err);
			}
			Todo.find().then(todos => {
				expect(todos.length).toBe(2);
				expect(todos[0].text).toBe("updated text");
				expect(todos[0].completed).toBe(true);
				expect(todos[0].completedAt).not.toBeNull()
				done();
			});
		});
	});

	it("should not be able to update the todo created by another user", done => {
		request(app)
		.patch(`/todos/${seedTodos[1]._id}`)
		.set("x-auth",seedUsers[0].tokens[0].token)
		.send({"text": "updated text", "completed": true})
		.expect(404)
		.end( (err, res) => {
			if(err) {
				return done(err);
			}
			Todo.find().then(todos => {
				expect(todos.length).toBe(2);
				expect(todos[1].text).toEqual(seedTodos[1].text);
				done();
			});
		});
	});
	it("should clear the completedAt property", done => {
		request(app)
		.patch(`/todos/${seedTodos[1]._id}`)
		.set("x-auth",seedUsers[1].tokens[0].token)
		.send({"completed": false})
		.expect(200)
		.end( (err, res) => {
			if(err) {
				return done(err);
			}
			Todo.find().then(todos => {
				expect(todos.length).toBe(2);
				expect(todos[1].text).toBe("second test todo");
				expect(todos[1].completed).toBe(false);
				expect(todos[1].completedAt).toBeNull()
				done();
			});
		});
	});

	it("should not find the todo", done => {
		request(app)
		.patch(`/todos/${seedTodos[0]._id +1}`)
		.set("x-auth",seedUsers[0].tokens[0].token)
		.send({"text": "updated text", "completed": true})
		.expect(404)
		.end( (err, res) => {
			if(err) {
				return done(err);
			}
			Todo.find().then(todos => {
				expect(todos.length).toBe(2);
				expect(todos[0].text).not.toBe("updated text");
				expect(todos[0].completed).toBe(false);
				expect(todos[0].completedAt).toBeNull()
				done();
			});
		});
	});

	it("should send a 404", done => {
		request(app)
		.patch(`/todos/${seedTodos[0]._id}1`)
		.set("x-auth",seedUsers[0].tokens[0].token)
		.send({"text": "updated text", "completed": true})
		.expect(404)
		.end( (err, res) => {
			if(err) {
				return done(err);
			}
			Todo.find().then(todos => {
				expect(todos.length).toBe(2);
				expect(todos[0].text).not.toBe("updated text");
				expect(todos[0].completed).toBe(false);
				expect(todos[0].completedAt).toBeNull()
				done();
			});
		});
	});
});

describe("GET /users/me", () => {
	it("should return user if authenticated", done => {
		request(app)
			.get("/users/me")
			.set("x-auth", seedUsers[0].tokens[0].token)
			.expect(200)
			.expect( res => {
				expect(res.body._id).toBe(seedUsers[0]._id.toHexString());
				expect(res.body.email).toBe(seedUsers[0].email);
			}).end(done);
	});

	it("should return a 401 if not authenticated", done => {
		request(app)
			.get("/users/me")
			.expect(401)
			.expect( res => expect(res.body).toEqual({}))
			.end(done);
	});
})

describe("POST /user", () => {
	it("should create a user", done => {
		var email = "azerty@gmail.com";
		var password = "pass1234";
		request(app)
			.post("/users")
			.send({email, password})
			.expect(200)
			.expect( res => {
				expect(res.header["x-auth"]).toBeDefined();
				expect(res.body._id).toBeDefined();
				expect(res.body.email).toBe(email);
			})
			.end( err => {
				if(err) {
					return done(err);
				}
				User.findOne({email}).then( user => {
					expect(user).toBeDefined();
					expect(user.email).toEqual(email);
					expect(user.password).not.toEqual(password);
					done();
				}).catch(e => done(e))
			})
	});

	it("should return validation errors if request invalid", done => {
		request(app)
			.post("/users")
			.send({email:"azer", password:"ty"})
			.expect(400)
			.end( (err,res) => {
				if(err) {
					return done(err);
				}
				User.find()
					.then( users => {
						expect(users.length).toEqual(2)
						return done();
					});
			});
	});

	it("should not create user if email in use", done => {
		var password = "pass1234";
		request(app)
			.post("/users")
			.send({email: seedUsers[0].email, password})
			.expect(400)
			.end( (err,res) => {
				if(err) {
					return done(err);
				}
				User.find()
					.then( users => {
						expect(users.length).toEqual(2)
						return done();
					});
			});
	});
})

describe("POST /users/login", () => {
	it("should return a user and its auth token", done => {
		request(app)
			.post("/users/login")
			.send({email: seedUsers[1].email, password: seedUsers[1].password})
			.expect(200)
			.expect( res => {
				expect(res.header["x-auth"]).toBeDefined();		
			})
			.end( (err, res) => {
				if(err) {
					return done(err);
				}
				User.findOne({email:seedUsers[1].email}).then( user => {
					expect(user).toBeDefined();
					expect(user.email).toEqual(seedUsers[1].email);
					expect(user.password).not.toEqual(seedUsers[1].password);
					expect(jwt.verify(user.tokens[1].token, "abc123"));
					return done();
				}).catch(e => done(e))
			})
	});

	it("should not enable the user to login (wrong email)", done => {
		request(app)
			.post("/users/login")
			.send({email: seedUsers[1].email+"az", password: seedUsers[1].password})
			.expect(400)
			.expect( res => {
				expect(res.header["x-auth"]).not.toBeDefined();		
			})
			.end( (err, res) => {
				if(err) {
					return done(err);
				}
				User.findOne({email:seedUsers[1].email}).then( user => {
					expect(user).toBeDefined();
					expect(user.email).toEqual(seedUsers[1].email);
					expect(user.password).not.toEqual(seedUsers[1].password);
					expect(user.tokens.length).toEqual(1);
					return done();
				}).catch(e => done(e))
			})
	});

	it("should not enable the user to login (wrong password)", done => {
		request(app)
			.post("/users/login")
			.send({email: seedUsers[1].email, password: seedUsers[1].password+"a"})
			.expect(400)
			.expect( res => {
				expect(res.header["x-auth"]).not.toBeDefined();		
			})
			.end( (err, res) => {
				if(err) {
					return done(err);
				}
				User.findOne({email:seedUsers[1].email}).then( user => {
					expect(user).toBeDefined();
					expect(user.email).toEqual(seedUsers[1].email);
					expect(user.password).not.toEqual(seedUsers[1].password);
					expect(user.tokens.length).toEqual(1);
					return done();
				}).catch(e => done(e))
			})
	});	
})

describe("DELETE /users/logout",  () => {
	it("should delete the auth token of the user", done => {
		request(app)
			.delete("/users/logout")
			.set("x-auth", seedUsers[0].tokens[0].token)
			.expect(200)
			.end((err, res) => {
				if(err) {
					return done(err);
				}
				User.findOne({email: seedUsers[0].email}).then( user => {
					expect(user).toBeDefined();
					expect(user.tokens[0]).not.toBeDefined();
					return done();
				}).catch(e => done(e))
			})
	})
})