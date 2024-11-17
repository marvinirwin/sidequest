import { App } from '@/app';
import { ValidateEnv } from '@utils/validateEnv';
import { ChatRoute } from './routes/chat.route';

ValidateEnv();

const app = new App([new ChatRoute()]);

app.listen();
