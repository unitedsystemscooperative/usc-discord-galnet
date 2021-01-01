import express from 'express';
require('dotenv').config();
import galNet from './galnet';

const app = express();

app.set('port', process.env.PORT || 3001);

app.listen(app.get('port'), () => {
  galNet();
});
