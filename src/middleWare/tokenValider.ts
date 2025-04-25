
import redis from "../utils/redisUtils";


import { Context, Next } from 'koa';

// 获取请求头中的token
const getToken = (ctx: Context) => {
    const token = ctx.headers['x-access-token'];
    return token;
}



const tokenValider = async (ctx: Context, next: Next) => {
    
    const token = getToken(ctx);

    
    if (!token) {
        ctx.status = 401;
        ctx.body = { auth: false, message: 'token失效请重新登陆' };
        return;
    }
    const  storedToken =  await redis.get("access-token");

    if (token !== storedToken) {
        ctx.status = 401;
        ctx.body = { auth: false, message: 'token失效请重新登陆' };
        return;
    }

    
    
  await  next();
}

export default tokenValider;