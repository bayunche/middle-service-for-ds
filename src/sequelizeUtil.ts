
import { Sequelize, DataTypes, Model } from 'sequelize';

const sequelize = new Sequelize(
    process.env.DB_NAME || 'chatdb',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
    }
);

// 新增 Conversation 模型
interface ConversationAttributes {
    id?: number;
    userId: number;
    created_at?: Date;
}
class Conversation extends Model<ConversationAttributes> implements ConversationAttributes {
    public id!: number;
    public userId!: number;
    public created_at!: Date;
}
Conversation.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
    sequelize,
    tableName: 'conversations',
    timestamps: false,
});

// 修改 ChatRecord 模型，新增字段：userId、conversationId 以及 flag（标记消息来源，如 'user' 或 'model'）
interface ChatRecordAttributes {
    id?: number;
    model: string;
    messages: any;
    response: any;
    created_at?: Date;
    userId: number;
    conversationId: number;
    flag: string;
}
class ChatRecord extends Model<ChatRecordAttributes> implements ChatRecordAttributes {
    public id!: number;
    public model!: string;
    public messages!: any;
    public response!: any;
    public created_at!: Date;
    public userId!: number;
    public conversationId!: number;
    public flag!: string;
}
ChatRecord.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    model: { type: DataTypes.STRING, allowNull: false },
    messages: { type: DataTypes.JSON, allowNull: false },
    response: { type: DataTypes.JSON, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    conversationId: { type: DataTypes.INTEGER, allowNull: false }, // 用于存储对应的对话记录id
    flag: { type: DataTypes.STRING, allowNull: false },
}, {
    sequelize,
    tableName: 'chat_records',
    timestamps: false,
});

// 建立关联关系：一条对话记录拥有多条消息记录
Conversation.hasMany(ChatRecord, { foreignKey: 'conversationId' });
ChatRecord.belongsTo(Conversation, { foreignKey: 'conversationId' });

export { sequelize, ChatRecord, Conversation };

