const {MongoClient, ObjectID} = require("mongodb");

const dbUrl = "mongodb://127.0.0.1:27017"

const dbName = "ToDoApp"

let getMongoClient = new Promise( (resolve, reject) => {
	MongoClient.connect(dbUrl, { useNewUrlParser: true }, (err, client) => {
		if (err) {
			reject(`An error has occured : ${err}`);
		}
		resolve(client);
	})
})

async function insertItem(item, collectionName) {
	const client = await getMongoClient;
	const db = client.db(dbName);

	const res = await db.collection(collectionName).insertOne(item);
	console.log(JSON.stringify(res.ops, undefined, 4));

	client.close()
}

async function deleteManyItems(item, collectionName) {
	const client = await getMongoClient;
	const db = client.db(dbName);
	const res = await db.collection(collectionName).deleteMany(item);
	console.log(`${res.result.n} element(s) deleted`);
}

// Could do the same with findOneAndDelete()

async function findItem(collectionName, filter = undefined) {
	const client = await getMongoClient;
	const db = client.db(dbName);
	const docs = await db.collection(collectionName).find(filter).toArray();

	console.log(JSON.stringify(docs, undefined, 4));
	client.close();
}

async function updateToDo(filter, updates) {
	const client = await getMongoClient;
	const db = client.db(dbName);
	const res = await db.collection("ToDos").findOneAndUpdate(filter, updates, {returnOriginal: false});
	console.log(res);

	client.close();
}

var completeToDo = (filter) => updateToDo(filter, {$set : {completed: true}});

completeToDo({text: "Walk the dog"});
// updateToDo({text: "Walk the dog"}, {$set: {completed: false}});

//deleteManyItems({text: "Todo1"}, "ToDos")
// insertItem({text: "Todo4", completed: false}, "ToDos");