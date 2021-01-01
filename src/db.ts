import { MongoClient } from 'mongodb';

const username = encodeURIComponent(process.env.MONGOUSER as string);
const userpass = encodeURIComponent(process.env.MONGOPASS as string);
const connectionString = `mongodb+srv://${username}:${userpass}@cluster0.xup6s.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const collectionName = 'latestGalNet';

export const getFromMongo = async (query?: any) => {
  let response: any[] = [];
  try {
    await client.connect();

    const database = client.db('usc');
    const collection = database.collection(collectionName);

    if (query && Object.keys(query).includes('index')) {
      query.index = parseInt(query.index);
    }
    const cursor = collection.find(query);
    response = await cursor.toArray();
    return response;
  } catch (err) {
    console.error(err);
  }
};

export const sendToMongo = async (updateDoc: any, query?: any) => {
  try {
    await client.connect();

    const database = client.db('usc');
    const collection = database.collection(collectionName);

    await collection.updateOne(query, updateDoc);
  } catch (err) {
    throw new Error('Failed to update. ' + err.message);
  } finally {
    await client.close();
  }
};
