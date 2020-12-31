import { readFileSync, writeFileSync } from 'fs';
import { IGalNetNewsArticle } from 'models/galnetNewsArticle';

const axios = require('axios').default;
const galnetAPI =
  'https://elitedangerous-website-backend-production.elitedangerous.com/api/galnet?_format=json';

export const listenForNews = () => {
  intervalFunction();
};

const intervalFunction = async () => {
  const response = await pollAPI();

  const newArticles = getNewArticles(response);

  setTimeout(intervalFunction, 3600000);
};

const pollAPI = async () => {
  const response = await axios.get(galnetAPI);
  const data: IGalNetNewsArticle[] = response.data;
  return data;
};

const getNewArticles = (unprocessedData: IGalNetNewsArticle[]) => {
  const unicodebreak = /<br \/>/g;
  const newLine = /\n/g;
  const lastNewLine = /\n$/;

  // console.log(unprocessedData[0]);
  getLatestID();

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
  // console.log(processedData[0]);
  // postToWebhook(
  //   processedData[0].title,
  //   processedData[0].body,
  //   processedData[0].date
  // );
};

const getLatestID = (): number => {
  writeFileSync('./latestArticleID.txt', '2251');
  const result = readFileSync('./latestarticleID.txt', 'utf-8');
  const latestID = result.trim();
  return parseInt(latestID);
};

const postToWebhook = async (title: string, message: string, date: string) => {
  axios.post(process.env.WEBHOOK_URL, {
    // content: `__**${title}**__\n\n${message}\n\n${date}`,
    embeds: [{ title, description: message, footer: { text: date } }],
  });
};

export default listenForNews;
