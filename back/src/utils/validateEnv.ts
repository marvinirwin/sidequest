import { cleanEnv, port, str } from 'envalid';

export const ValidateEnv = () => {
  console.log("What2")
  cleanEnv(process.env, {
    NODE_ENV: str(),
    PORT: port(),
  });
};
