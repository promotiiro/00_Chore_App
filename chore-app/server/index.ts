import express from 'express';
import cors from 'cors';
import membersRouter from './routes/members';
import choresRouter from './routes/chores';
import completionsRouter from './routes/completions';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json());

app.use('/api/members', membersRouter);
app.use('/api/chores', choresRouter);
app.use('/api/completions', completionsRouter);

app.listen(PORT, () => {
  console.log(`🧹  Chore App server → http://localhost:${PORT}`);
});
