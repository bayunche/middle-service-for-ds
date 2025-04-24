
import { ChatRecord } from './sequelizeUtil';

// 使用 Sequelize 保存消息记录
export async function saveMessage(record: {
    model: string;
    messages: any;
    response: any;
    createdAt?: Date;
    userId: number;
    conversationId: number;
    flag: string
}): Promise<void> {
    const { model, messages, response, createdAt, userId, conversationId, flag } = record;
    await ChatRecord.create({
        model,
        messages,
        response,
        created_at: createdAt || new Date(),
        userId,
        conversationId,
        flag
    });
}



