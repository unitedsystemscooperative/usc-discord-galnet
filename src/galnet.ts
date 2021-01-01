import { IGalNetNewsArticle } from 'models/galnetNewsArticle';
import axios from 'axios';
import { getFromMongo, sendToMongo } from './db';
import { ObjectID } from 'bson';

// const axios = require('axios').default;
const galnetAPI =
  'https://elitedangerous-website-backend-production.elitedangerous.com/api/galnet?_format=json';

// const galnetAPI = 'https://www.alpha-orbital.com/galnet-feed';

export const listenForNews = () => {
  intervalFunction();
};

const intervalFunction = async () => {
  const response = await pollAPI();

  if (response) {
    const articles = await getNewArticles(response);
    if (articles) {
      if (articles.newArticles.length > 1) {
        for (const article of articles.newArticles) {
          for (const webhook of articles.webhooks) {
            await postToWebhook(article, webhook);
          }
        }
        const id = articles.newArticles[0].id;
        const currentID = articles.currentID;
        const webhooks = articles.webhooks;
        if (id) {
          const filter = { latestID: currentID };
          const updateDoc = { $set: { latestID: id, webhooks } };
          await sendToMongo(updateDoc, filter);
        }
      } else {
        console.log('No further articles.');
      }
    }
  }

  setTimeout(intervalFunction, 10800000);
};

const pollAPI = async () => {
  try {
    const response = await axios.get<IGalNetNewsArticle[]>(galnetAPI);
    const data: IGalNetNewsArticle[] = response.data;
    return data;
  } catch (err) {
    console.error('Failed to get from api', err);
  }
};

const getNewArticles = async (unprocessedData: IGalNetNewsArticle[]) => {
  const unicodebreak = /<br \/>/g;
  const newLine = /\n/g;
  const lastNewLine = /\n$/;

  // console.log(unprocessedData);

  const processedData = unprocessedData.map((data) => {
    const updatedString = data.body
      .replace('<p>', '')
      .replace(unicodebreak, '')
      .replace('</p>', '')
      .replace(lastNewLine, '')
      .replace(newLine, '\n> ');
    const id = parseInt(data.nid);
    return { ...data, body: updatedString, id };
  });

  const latestID: { _id: ObjectID; latestID: number; webhooks: string[] }[] =
    (await getFromMongo()) ?? [];
  if (latestID && latestID.length > 0) {
    const newArticles = processedData.filter(
      (x) => x.id > latestID[0].latestID
    );
    const webhooks = latestID[0].webhooks;
    const currentID = latestID[0].latestID;
    return { newArticles, webhooks, currentID };
  } else {
    return undefined;
  }
};

const postToWebhook = async (value: IGalNetNewsArticle, webhook: string) => {
  try {
    if (webhook) {
      axios.post(webhook, {
        // content: `__**${title}**__\n\n${message}\n\n${date}`,
        embeds: [
          {
            title: value.title,
            description: value.body,
            footer: { text: value.date },
          },
        ],
      });
    }
  } catch (err) {
    console.log('failed to post webhook', err);
  }
};

export default listenForNews;
