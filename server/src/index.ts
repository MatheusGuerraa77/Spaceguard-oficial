import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import neo from './routes/neo';
import simulate from './routes/simulate';
import debugRouter from './routes/debug';   // <- adicione isto

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/neo', neo);
app.use('/api/simulate', simulate);
app.use('/api/debug', debugRouter);         // <- e isto

const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`SpaceGuard API on http://localhost:${port}`));
