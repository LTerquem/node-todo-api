const {MongoClient, ObjectID} = require("mongodb");

const dbUrl = "mongodb://127.0.0.1:27017"

const dbName = "ToDoApp"

let getMongoClient = new Promise( (resolve, reject) => {
	MongoClient.connect(dbUrl, (err, client) => {
		if (err) {
			reject(`An error has occured : ${err}`);
		}
		resolve(client);
	})
})

var insertItem = (item, collectionName) => {
	const client = getMongoClient();
	const db = client.db(dbName);

	db.collection(collectionName).insertOne(item, (err, res) => {
		if(err) {
			return console.log(`Unable to insert the document: ${err}`);
		}
		console.log(JSON.stringify(res.ops, undefined, 4));
	})

	client.close()
}

async function findItem(collectionName, filter = undefined) {
	const client = await getMongoClient;
	const db = client.db(dbName);
	const docs = await db.collection(collectionName).find(filter).toArray();

	console.log(JSON.stringify(docs, undefined, 4));
	client.close();
}

findItem("Users", {name:"Lucas"});